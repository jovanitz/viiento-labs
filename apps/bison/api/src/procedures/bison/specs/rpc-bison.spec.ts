import { describe, expect, it } from 'vitest';
import { callRpc, errorTag, testRuntime } from '../../testing/rpc-harness';

/**
 * Per-procedure contracts for the bison client surface, end-to-end through
 * the real composition root (in-memory store + storage). The core loop:
 * create a client and a template, log a filled entry, read the timeline,
 * attach a file and sign its path back.
 */
const TOKEN = 'session-customer';

const rpc = async <T>(
  app: ReturnType<typeof testRuntime>['app'],
  procedure: string,
  body?: unknown,
): Promise<T> => {
  const res = await callRpc(app, procedure, { token: TOKEN, body });
  expect(res.status, `${procedure} should 200`).toBe(200);
  return ((await res.json()) as { data: T }).data;
};

const setupWorld = async (app: ReturnType<typeof testRuntime>['app']) => {
  const client = await rpc<{ id: string; initials: string }>(
    app,
    'bison.clients.create',
    { name: 'Diana Mendoza', phone: '55 1234 5678' },
  );
  const template = await rpc<{ id: string; kind: string }>(
    app,
    'bison.templates.create',
    {
      name: 'Consulta',
      icon: 'stethoscope',
      color: 'teal',
      blocks: [
        {
          id: 'motivo',
          kind: 'short-text',
          label: 'Motivo',
          required: true,
          width: 'full',
        },
        {
          kind: 'radio',
          label: 'Vía',
          width: 'half',
          options: ['Oral', 'Tópica'],
        },
      ],
    },
  );
  return { client, template };
};

describe('the bison client surface', () => {
  it('runs the core loop: client → template → log → timeline', async () => {
    const { app } = testRuntime();
    const { client, template } = await setupWorld(app);
    expect(client.initials).toBe('DM');
    expect(template.kind).toBe('custom');

    const entry = await rpc<{ summary: string; templateName: string }>(
      app,
      'bison.timeline.log',
      {
        clientId: client.id,
        templateId: template.id,
        values: { motivo: 'Dolor de cabeza' },
      },
    );
    expect(entry.summary).toBe('Dolor de cabeza');
    expect(entry.templateName).toBe('Consulta');

    const timeline = await rpc<ReadonlyArray<{ summary: string }>>(
      app,
      'bison.timeline.list',
      { clientId: client.id },
    );
    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.summary).toBe('Dolor de cabeza');
  });

  it('400s a fill that violates the template schema, listing offenders', async () => {
    const { app } = testRuntime();
    const { client, template } = await setupWorld(app);

    const res = await callRpc(app, 'bison.timeline.log', {
      token: TOKEN,
      body: {
        clientId: client.id,
        templateId: template.id,
        values: { fantasma: 'x' },
      },
    });
    expect(res.status).toBe(400);
    expect(await errorTag(res)).toBe('domain/invalid-entry-values');
  });

  it('attaches a file and signs its path back — and only its own paths', async () => {
    const { app } = testRuntime();
    const { client } = await setupWorld(app);

    const value = await rpc<string>(app, 'bison.files.attach', {
      clientId: client.id,
      name: 'radiografia.png',
      mime: 'image/png',
      bytesBase64: Buffer.from([1, 2, 3, 4]).toString('base64'),
    });
    const ref = JSON.parse(value) as { storagePath: string; size: number };
    expect(ref.size).toBe(4);

    const url = await rpc<string>(app, 'bison.files.url', {
      storagePath: ref.storagePath,
    });
    expect(url).toContain(ref.storagePath);

    const foreign = await callRpc(app, 'bison.files.url', {
      token: TOKEN,
      body: { storagePath: 'clients/cli-ajena/file-9' },
    });
    expect(foreign.status).toBe(404);
    expect(await errorTag(foreign)).toBe('app/client-not-found');
  });

  it('books, reschedules, cancels and surfaces visit facts', async () => {
    const { app } = testRuntime();
    const { client } = await setupWorld(app);

    const booked = await rpc<{ id: string; clientName: string }>(
      app,
      'bison.agenda.book',
      {
        clientId: client.id,
        service: 'Classic cut',
        date: '2026-08-21',
        startMin: 540,
        durationMinutes: 45,
      },
    );
    expect(booked.clientName).toBe('Diana Mendoza');

    const moved = await rpc<{ startMin: number }>(
      app,
      'bison.agenda.reschedule',
      { id: booked.id, move: { startMin: 600 } },
    );
    expect(moved.startMin).toBe(600);

    const day = await rpc<ReadonlyArray<{ id: string }>>(
      app,
      'bison.agenda.list',
      { date: '2026-08-21' },
    );
    expect(day.map((a) => a.id)).toEqual([booked.id]);

    const visits = await rpc<
      ReadonlyArray<{ clientId: string; visitCount: number }>
    >(app, 'bison.agenda.visits', {});
    expect(visits).toEqual([
      expect.objectContaining({ clientId: client.id, visitCount: 1 }),
    ]);

    await rpc(app, 'bison.agenda.cancel', { id: booked.id });
    const movedAgain = await callRpc(app, 'bison.agenda.reschedule', {
      token: TOKEN,
      body: { id: booked.id, move: { startMin: 660 } },
    });
    expect(movedAgain.status).toBe(400);
    expect(await errorTag(movedAgain)).toBe('domain/appointment-canceled');
  });

  it('adds, lists and removes blocked time', async () => {
    const { app } = testRuntime();

    const added = await rpc<{ id: string; startMin: number }>(
      app,
      'bison.agenda.blocks.add',
      {
        label: 'Comida',
        allDay: false,
        startMin: 13 * 60,
        endMin: 14 * 60,
        dates: { kind: 'recurring', pattern: [1, 2, 3, 4, 5] },
      },
    );
    const vacation = await rpc<{ id: string }>(app, 'bison.agenda.blocks.add', {
      label: 'Vacaciones',
      allDay: true,
      startMin: 0,
      endMin: 1440,
      dates: { kind: 'range', start: '2026-08-24', end: '2026-08-28' },
    });

    const listed = await rpc<ReadonlyArray<{ label: string }>>(
      app,
      'bison.agenda.blocks.list',
      {},
    );
    expect(listed.map((b) => b.label).sort()).toEqual(['Comida', 'Vacaciones']);

    await rpc(app, 'bison.agenda.blocks.remove', { id: vacation.id });
    const after = await rpc<ReadonlyArray<{ id: string }>>(
      app,
      'bison.agenda.blocks.list',
      {},
    );
    expect(after.map((b) => b.id)).toEqual([added.id]);

    const invalid = await callRpc(app, 'bison.agenda.blocks.add', {
      token: TOKEN,
      body: {
        label: 'Mal',
        allDay: false,
        startMin: 900,
        endMin: 600,
        dates: { kind: 'recurring', pattern: 'daily' },
      },
    });
    expect(invalid.status).toBe(400);
    expect(await errorTag(invalid)).toBe('domain/invalid-calendar-block');
  });

  it('404s a template from another world and 401s without a session', async () => {
    const { app } = testRuntime();
    const missing = await callRpc(app, 'bison.templates.get', {
      token: TOKEN,
      body: { id: 'nope' },
    });
    expect(missing.status).toBe(404);

    const anonymous = await callRpc(app, 'bison.clients.list', {});
    expect(anonymous.status).toBe(401);
  });
});
