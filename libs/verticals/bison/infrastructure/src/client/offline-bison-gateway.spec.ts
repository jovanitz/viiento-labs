import { describe, expect, it } from 'vitest';
import { err, ok } from '@acme/shared';
import { createInMemoryKvCache } from '@acme/application';
import { bisonGatewayError } from '@acme/bison-application';
import type { BisonClientGateway } from '@acme/bison-application';
import { withOfflineCache } from './offline-bison-gateway';

const OFFLINE = bisonGatewayError('network down');
const DENIED = { tag: 'app/access-denied' as const, message: 'no' };

/** Only the surfaces this spec exercises; reads flip between live and
 *  offline via the `online` switch. */
const fakeGateway = () => {
  const state = { online: true, clients: [{ id: 'c1', name: 'Diana' }] };
  const read =
    <T>(value: T) =>
    async () =>
      state.online ? ok(value as never) : err(OFFLINE);
  const gateway = {
    templates: { list: read([{ id: 't1' }]), get: read({ id: 't1' }) },
    clients: {
      list: async () => (state.online ? ok(state.clients) : err(OFFLINE)),
      get: read({ id: 'c1' }),
      create: async () => (state.online ? ok({ id: 'c2' }) : err(OFFLINE)),
    },
    timeline: { list: read([]) },
    agenda: {
      list: read([]),
      visits: read([]),
      blocks: { list: read([]) },
    },
    formats: { list: read([]) },
    files: { url: async () => err(DENIED) },
  } as unknown as BisonClientGateway;
  return { gateway, state };
};

describe('withOfflineCache', () => {
  it('serves the last known copy when the transport fails', async () => {
    const { gateway, state } = fakeGateway();
    const offline = withOfflineCache(gateway, createInMemoryKvCache());

    const warm = await offline.clients.list();
    expect(warm.ok).toBe(true);

    state.online = false;
    const cached = await offline.clients.list();
    expect(cached.ok).toBe(true);
    if (cached.ok) expect(cached.value).toEqual([{ id: 'c1', name: 'Diana' }]);
  });

  it('returns the original error on a cold cache', async () => {
    const { gateway, state } = fakeGateway();
    const offline = withOfflineCache(gateway, createInMemoryKvCache());
    state.online = false;
    const cold = await offline.timeline.list({ clientId: 'c1' });
    expect(cold.ok).toBe(false);
    if (!cold.ok) expect(cold.error.tag).toBe('app/bison-gateway-error');
  });

  it('caches per input — another client misses', async () => {
    const { gateway, state } = fakeGateway();
    const offline = withOfflineCache(gateway, createInMemoryKvCache());
    await offline.timeline.list({ clientId: 'c1' });
    state.online = false;
    expect((await offline.timeline.list({ clientId: 'c1' })).ok).toBe(true);
    expect((await offline.timeline.list({ clientId: 'c2' })).ok).toBe(false);
  });

  it('never masks server verdicts, and never queues mutations', async () => {
    const { gateway, state } = fakeGateway();
    const cache = createInMemoryKvCache();
    const offline = withOfflineCache(gateway, cache);

    // A denied read reached the server — no fallback even with a warm cache.
    const denied = await offline.files.url({ storagePath: 'x' });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.tag).toBe('app/access-denied');

    state.online = false;
    const write = await offline.clients.create({ name: 'X' });
    expect(write.ok).toBe(false);
  });

  it('degrades to no-fallback when the cache itself breaks', async () => {
    const { gateway, state } = fakeGateway();
    const broken = {
      get: async () => {
        throw new Error('boom');
      },
      set: async () => {
        throw new Error('boom');
      },
    };
    const offline = withOfflineCache(gateway, broken);
    expect((await offline.clients.list()).ok).toBe(true);
    state.online = false;
    expect((await offline.clients.list()).ok).toBe(false);
  });
});
