import { describe, expect, it } from 'vitest';
import { fixedClock, noopLogger, sequentialIdGenerator } from '@acme/shared';
import type { Client } from '@acme/bison-domain';
import type { ClientRepository } from './ports';
import { makeClientUseCases } from './use-cases';

const inMemoryClients = (seed: Client[] = []): ClientRepository => {
  const store = new Map<string, Client>(seed.map((c) => [c.id, c]));
  return {
    findById: async (id) => store.get(id) ?? null,
    list: async () => [...store.values()],
    save: async (client) => {
      store.set(client.id, client);
    },
  };
};

const deps = (repo: ClientRepository) => ({
  clients: repo,
  clock: fixedClock(new Date('2026-08-19T12:00:00.000Z')),
  ids: sequentialIdGenerator('cli'),
  logger: noopLogger,
});

describe('Client use cases', () => {
  it('creates a client and derives avatar initials in the DTO', async () => {
    const useCases = makeClientUseCases(deps(inMemoryClients()));
    const created = await useCases.create({ name: 'Diana Mendoza' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.initials).toBe('DM');
    expect(created.value.channels.telegram).toBe('not_connected');

    const listed = await useCases.list();
    expect(listed).toHaveLength(1);
  });

  it('updates contact data and reports a missing client', async () => {
    const repo = inMemoryClients();
    const useCases = makeClientUseCases(deps(repo));
    const created = await useCases.create({ name: 'Diana' });
    if (!created.ok) throw new Error('fixture create must succeed');

    const updated = await useCases.updateContact({
      id: created.value.id,
      changes: { phone: '55 0000 0000' },
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) expect(updated.value.phone).toBe('55 0000 0000');

    const missing = await useCases.get({ id: 'nope' });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.tag).toBe('app/client-not-found');
  });
});
