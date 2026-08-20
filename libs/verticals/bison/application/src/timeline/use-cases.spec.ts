import { describe, expect, it } from 'vitest';
import { fixedClock, noopLogger, sequentialIdGenerator } from '@acme/shared';
import type { Client, Entry, Template } from '@acme/bison-domain';
import { makeClientUseCases } from '../clients/use-cases';
import type { ClientRepository } from '../clients/ports';
import { makeTemplateUseCases } from '../templates/use-cases';
import type { TemplateRepository } from '../templates/ports';
import type { EntryRepository } from './ports';
import { makeTimelineUseCases } from './use-cases';

const inMemoryTemplates = (): TemplateRepository => {
  const store = new Map<string, Template>();
  return {
    findById: async (id) => store.get(id) ?? null,
    list: async () => [...store.values()],
    save: async (template) => {
      store.set(template.id, template);
    },
  };
};

const inMemoryClients = (): ClientRepository => {
  const store = new Map<string, Client>();
  return {
    findById: async (id) => store.get(id) ?? null,
    list: async () => [...store.values()],
    save: async (client) => {
      store.set(client.id, client);
    },
  };
};

const inMemoryEntries = (): EntryRepository => {
  const store: Entry[] = [];
  return {
    append: async (entry) => {
      store.push(entry);
    },
    listByClient: async (clientId) =>
      store
        .filter((entry) => entry.clientId === clientId)
        .sort((a, b) => b.at.localeCompare(a.at)),
  };
};

const harness = async () => {
  const templates = inMemoryTemplates();
  const clients = inMemoryClients();
  const entries = inMemoryEntries();
  const shared = {
    clock: fixedClock(new Date('2026-08-19T12:00:00.000Z')),
    ids: sequentialIdGenerator('id'),
    logger: noopLogger,
  };
  const timeline = makeTimelineUseCases({
    entries,
    templates,
    clients,
    ...shared,
  });

  const template = await makeTemplateUseCases({
    templates,
    ...shared,
  }).create({
    name: 'Consulta',
    description: '',
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
    ],
  });
  if (!template.ok) throw new Error('fixture template must succeed');

  const client = await makeClientUseCases({ clients, ...shared }).create({
    name: 'Diana Mendoza',
  });
  if (!client.ok) throw new Error('fixture client must succeed');

  return { timeline, templateId: template.value.id, clientId: client.value.id };
};

describe('Timeline use cases', () => {
  it('logs a valid fill and lists it back, newest first', async () => {
    const { timeline, templateId, clientId } = await harness();

    const logged = await timeline.logEntry({
      clientId,
      templateId,
      values: { motivo: 'Dolor de cabeza' },
    });
    expect(logged.ok).toBe(true);
    if (!logged.ok) return;
    expect(logged.value.summary).toBe('Dolor de cabeza');
    expect(logged.value.templateName).toBe('Consulta');

    const listed = await timeline.list({ clientId });
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.value).toHaveLength(1);
    expect(listed.value[0]?.fields).toEqual([
      { blockId: 'motivo', label: 'Motivo', value: 'Dolor de cabeza' },
    ]);
  });

  it('propagates fill validation from the domain', async () => {
    const { timeline, templateId, clientId } = await harness();
    const logged = await timeline.logEntry({
      clientId,
      templateId,
      values: {},
    });
    expect(logged.ok).toBe(false);
    if (logged.ok) return;
    expect(logged.error.tag).toBe('domain/invalid-entry-values');
  });

  it('refuses an unknown client or template', async () => {
    const { timeline, templateId, clientId } = await harness();

    const noClient = await timeline.logEntry({
      clientId: 'nope',
      templateId,
      values: { motivo: 'x' },
    });
    expect(noClient.ok).toBe(false);
    if (!noClient.ok) expect(noClient.error.tag).toBe('app/client-not-found');

    const noTemplate = await timeline.logEntry({
      clientId,
      templateId: 'nope',
      values: { motivo: 'x' },
    });
    expect(noTemplate.ok).toBe(false);
    if (!noTemplate.ok) {
      expect(noTemplate.error.tag).toBe('app/template-not-found');
    }

    const noTimeline = await timeline.list({ clientId: 'nope' });
    expect(noTimeline.ok).toBe(false);
    if (!noTimeline.ok) {
      expect(noTimeline.error.tag).toBe('app/client-not-found');
    }
  });
});
