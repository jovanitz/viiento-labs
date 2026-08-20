import { describe, expect, it } from 'vitest';
import type {
  Client,
  ClientId,
  Entry,
  EntryId,
  Template,
  TemplateId,
} from '@acme/bison-domain';
import type { BisonAccountStore } from '../persistence/in-memory-bison-store';

/**
 * Contract for one account's bison store: every adapter (in-memory,
 * Postgres) must satisfy it, so they are genuinely interchangeable.
 * `makeStore` must return a FRESH, EMPTY account world each call (the
 * Postgres spec fulfils that with a new account row — no wiping needed).
 * Ids are uuids so the same fixtures satisfy uuid columns.
 */
const NOW = '2026-08-19T12:00:00.000Z';

export const template = (over: Partial<Template> = {}): Template => ({
  id: crypto.randomUUID() as TemplateId,
  name: 'Receta',
  description: 'Prescripción simple',
  icon: 'stethoscope',
  color: 'teal',
  kind: 'custom',
  blocks: [
    { id: 'sec', kind: 'section', label: 'Datos', width: 'full' },
    {
      id: 'motivo',
      kind: 'short-text',
      label: 'Motivo',
      required: true,
      width: 'half',
    },
    {
      id: 'via',
      kind: 'radio',
      label: 'Vía',
      width: 'half',
      options: ['Oral'],
    },
  ],
  createdAt: NOW,
  updatedAt: NOW,
  ...over,
});

export const client = (over: Partial<Client> = {}): Client => ({
  id: crypto.randomUUID() as ClientId,
  name: 'Diana Mendoza',
  phone: '55 1234 5678',
  channels: { telegram: 'verified', whatsapp: 'not_connected' },
  createdAt: NOW,
  updatedAt: NOW,
  ...over,
});

export const entry = (
  clientId: ClientId,
  over: Partial<Entry> = {},
): Entry => ({
  id: crypto.randomUUID() as EntryId,
  clientId,
  templateId: crypto.randomUUID() as TemplateId,
  templateName: 'Receta',
  icon: 'stethoscope',
  color: 'teal',
  at: NOW,
  summary: 'Dolor de cabeza',
  fields: [
    { blockId: 'motivo', label: 'Motivo', value: 'Dolor de cabeza' },
    { blockId: 'via', label: 'Vía', value: 'Oral' },
  ],
  ...over,
});

const templateCases = (
  makeStore: () => BisonAccountStore | Promise<BisonAccountStore>,
): void => {
  it('returns null for a missing template', async () => {
    const store = await makeStore();
    expect(await store.templates.findById(template().id)).toBeNull();
  });

  it('round-trips a template with its whole schema', async () => {
    const store = await makeStore();
    const saved = template();
    await store.templates.save(saved);
    const found = await store.templates.findById(saved.id);
    expect(found).toEqual(saved);
  });

  it('upserts on save with the same id', async () => {
    const store = await makeStore();
    const saved = template();
    await store.templates.save(saved);
    await store.templates.save({ ...saved, name: 'Renombrada' });
    const found = await store.templates.findById(saved.id);
    expect(found?.name).toBe('Renombrada');
  });

  it('lists defaults first, then customs by name', async () => {
    const store = await makeStore();
    await store.templates.save(template({ name: 'Zeta', kind: 'custom' }));
    await store.templates.save(template({ name: 'Alfa', kind: 'custom' }));
    await store.templates.save(template({ name: 'Meta', kind: 'default' }));
    const names = (await store.templates.list()).map((t) => t.name);
    expect(names).toEqual(['Meta', 'Alfa', 'Zeta']);
  });
};

const clientCases = (
  makeStore: () => BisonAccountStore | Promise<BisonAccountStore>,
): void => {
  it('round-trips a client, channels included', async () => {
    const store = await makeStore();
    const saved = client();
    await store.clients.save(saved);
    const found = await store.clients.findById(saved.id);
    expect(found).toEqual({ ...saved, photoUrl: undefined });
  });

  it('lists clients by name', async () => {
    const store = await makeStore();
    await store.clients.save(client({ name: 'Zoe' }));
    await store.clients.save(client({ name: 'Ana' }));
    const names = (await store.clients.list()).map((c) => c.name);
    expect(names).toEqual(['Ana', 'Zoe']);
  });
};

const entryCases = (
  makeStore: () => BisonAccountStore | Promise<BisonAccountStore>,
): void => {
  it('appends entries and reads a client timeline newest first', async () => {
    const store = await makeStore();
    const owner = client();
    await store.clients.save(owner);
    const older = entry(owner.id, { at: '2026-08-18T09:00:00.000Z' });
    const newer = entry(owner.id, { at: '2026-08-19T09:00:00.000Z' });
    await store.entries.append(older);
    await store.entries.append(newer);

    const listed = await store.entries.listByClient(owner.id);
    expect(listed.map((e) => e.id)).toEqual([newer.id, older.id]);
    expect(listed[0]).toEqual(newer);
  });

  it("excludes other clients' entries", async () => {
    const store = await makeStore();
    const one = client({ name: 'Uno' });
    const two = client({ name: 'Dos' });
    await store.clients.save(one);
    await store.clients.save(two);
    await store.entries.append(entry(one.id));

    expect(await store.entries.listByClient(two.id)).toEqual([]);
  });

  it('returns an empty timeline for an unknown client', async () => {
    const store = await makeStore();
    expect(await store.entries.listByClient(client().id)).toEqual([]);
  });
};

export const bisonStoreContract = (
  name: string,
  makeStore: () => BisonAccountStore | Promise<BisonAccountStore>,
): void => {
  describe(`BisonAccountStore contract: ${name}`, () => {
    describe('templates', () => templateCases(makeStore));
    describe('clients', () => clientCases(makeStore));
    describe('entries', () => entryCases(makeStore));
  });
};
