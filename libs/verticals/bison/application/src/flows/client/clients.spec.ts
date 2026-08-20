import { describe, expect, it } from 'vitest';
import { err, ok } from '@acme/shared';
import { findFlowCommand } from '@acme/application';
import type { ClientDto } from '../../clients/dto';
import type { EntryDto } from '../../timeline/dto';
import type { TemplateDto } from '../../templates/dto';
import { bisonGatewayError } from '../../client/gateway';
import type { BisonClientGateway } from '../../client/gateway';
import { loadClientDetail, loadClients } from './clients';
import { BISON_CLIENT_FLOWS } from './registry';

/**
 * Headless proof: the controllers (and the registry driving them by name,
 * the way an MCP dispatcher would) run against a fake gateway — no React,
 * no transport, no backend.
 */
const template: TemplateDto = {
  id: 'tpl-1',
  name: 'Consulta',
  description: '',
  icon: 'stethoscope',
  color: 'teal',
  kind: 'custom',
  blocks: [
    {
      id: 'motivo',
      kind: 'short-text',
      label: 'Motivo',
      required: true,
      width: 'full',
    },
  ],
  createdAt: '2026-08-19T12:00:00.000Z',
  updatedAt: '2026-08-19T12:00:00.000Z',
};

const fakeGateway = () => {
  const clients: ClientDto[] = [];
  const entries: EntryDto[] = [];
  let seq = 0;

  const gateway: BisonClientGateway = {
    templates: {
      list: async () => ok([template]),
      get: async () => ok(template),
      create: async () => ok(template),
      update: async () => ok(template),
    },
    clients: {
      list: async () =>
        ok([...clients].sort((a, b) => a.name.localeCompare(b.name))),
      get: async ({ id }) => {
        const found = clients.find((c) => c.id === id);
        return found ? ok(found) : err(bisonGatewayError(`No client ${id}.`));
      },
      create: async ({ name, phone }) => {
        const client: ClientDto = {
          id: `cli-${++seq}`,
          name,
          initials: 'XX',
          phone: phone ?? '',
          channels: { telegram: 'not_connected', whatsapp: 'not_connected' },
          createdAt: '2026-08-19T12:00:00.000Z',
          updatedAt: '2026-08-19T12:00:00.000Z',
        };
        clients.push(client);
        return ok(client);
      },
      updateContact: async ({ id }) => {
        const found = clients.find((c) => c.id === id);
        return found ? ok(found) : err(bisonGatewayError(`No client ${id}.`));
      },
    },
    timeline: {
      list: async ({ clientId }) =>
        ok(
          entries
            .filter((e) => e.clientId === clientId)
            .sort((a, b) => b.at.localeCompare(a.at)),
        ),
      log: async ({ clientId, templateId, values }) => {
        const entry: EntryDto = {
          id: `ent-${++seq}`,
          clientId,
          templateId,
          templateName: template.name,
          icon: template.icon,
          color: template.color,
          at: `2026-08-1${entries.length + 1}T15:30:00.000Z`,
          summary: values['motivo'] ?? '',
          fields: [
            {
              blockId: 'motivo',
              label: 'Motivo',
              value: values['motivo'] ?? '',
            },
          ],
        };
        entries.push(entry);
        return ok(entry);
      },
    },
    files: {
      attach: async () => ok('{"kind":"file"}'),
      url: async () => ok('memory://x'),
    },
    agenda: {
      list: async () => ok([]),
      book: async () => {
        throw new Error('not exercised here');
      },
      reschedule: async () => {
        throw new Error('not exercised here');
      },
      cancel: async () => {
        throw new Error('not exercised here');
      },
      visits: async () => ok([]),
      blocks: {
        list: async () => ok([]),
        add: async () => {
          throw new Error('not exercised here');
        },
        remove: async () => ok(undefined),
      },
    },
  };
  return gateway;
};

describe('bison client flows', () => {
  it('builds the roster VM with its summary line', async () => {
    const gateway = fakeGateway();
    await gateway.clients.create({ name: 'Diana' });
    const vm = await loadClients({ gateway });
    expect(vm.ok).toBe(true);
    if (!vm.ok) return;
    expect(vm.value.summary).toBe('1 client');
    expect(vm.value.clients[0]?.visitCount).toBe(0);
  });

  it('groups the detail timeline into labeled days, newest first', async () => {
    const gateway = fakeGateway();
    const created = await gateway.clients.create({ name: 'Diana' });
    if (!created.ok) throw new Error('fixture');
    const clientId = created.value.id;
    await gateway.timeline.log({
      clientId,
      templateId: 'tpl-1',
      values: { motivo: 'Primera' },
    });
    await gateway.timeline.log({
      clientId,
      templateId: 'tpl-1',
      values: { motivo: 'Segunda' },
    });

    const detail = await loadClientDetail({ gateway }, { clientId });
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;
    expect(detail.value.templates).toHaveLength(1);
    expect(detail.value.days).toHaveLength(2);
    expect(detail.value.days[0]?.entries[0]?.summary).toBe('Segunda');
    expect(detail.value.days[0]?.dateLabel).toMatch(/August/);
    expect(detail.value.days[0]?.entries[0]?.timeLabel).toMatch(
      /\d{1,2}:\d{2}/,
    );
  });

  it('is drivable by name through the registry, like an MCP dispatcher', async () => {
    const gateway = fakeGateway();
    const create = findFlowCommand(
      BISON_CLIENT_FLOWS,
      'bison.clients.createClient',
    );
    const board = findFlowCommand(BISON_CLIENT_FLOWS, 'bison.clients.board');
    if (!create || !board) throw new Error('registry entries must exist');

    const input = create.input.parse({ name: 'Diana Mendoza' });
    const created = await create.run({ gateway }, input);
    expect(created.ok).toBe(true);

    const listed = await board.run({ gateway }, board.input.parse({}));
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect((listed.value as { summary?: string }).summary).toBe('1 client');
    }
  });

  it('rejects malformed registry input before running', () => {
    const log = findFlowCommand(BISON_CLIENT_FLOWS, 'bison.timeline.logEntry');
    if (!log) throw new Error('registry entry must exist');
    expect(() => log.input.parse({ clientId: 'c1' })).toThrow();
  });
});
