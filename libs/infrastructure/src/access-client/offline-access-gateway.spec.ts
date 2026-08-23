import { describe, expect, it } from 'vitest';
import { err, ok } from '@acme/shared';
import {
  accessDenied,
  accessGatewayError,
  createInMemoryKvCache,
} from '@acme/application';
import type { CurrentAccessGateway } from '@acme/application';
import { withOfflineAccessCache } from './offline-access-gateway';

const SNAPSHOT = { membershipId: 'm1', blocked: false };

const fakeGateway = (state: { mode: 'ok' | 'offline' | 'denied' }) =>
  ({
    fetchCurrentAccess: async () => {
      if (state.mode === 'ok') return ok(SNAPSHOT);
      if (state.mode === 'denied') return err(accessDenied('revoked'));
      return err(accessGatewayError('network down'));
    },
  }) as unknown as CurrentAccessGateway;

describe('withOfflineAccessCache', () => {
  it('serves the last snapshot when the transport fails', async () => {
    const state = { mode: 'ok' as const } as { mode: 'ok' | 'offline' };
    const gateway = withOfflineAccessCache(
      fakeGateway(state),
      createInMemoryKvCache(),
    );
    expect((await gateway.fetchCurrentAccess()).ok).toBe(true);
    state.mode = 'offline';
    const cached = await gateway.fetchCurrentAccess();
    expect(cached.ok).toBe(true);
    if (cached.ok) expect(cached.value).toEqual(SNAPSHOT);
  });

  it('returns the transport error on a cold cache', async () => {
    const gateway = withOfflineAccessCache(
      fakeGateway({ mode: 'offline' }),
      createInMemoryKvCache(),
    );
    const cold = await gateway.fetchCurrentAccess();
    expect(cold.ok).toBe(false);
    if (!cold.ok) expect(cold.error.tag).toBe('app/access-gateway-error');
  });

  it('never masks an access-denied verdict, even with a warm cache', async () => {
    const state = { mode: 'ok' as const } as { mode: 'ok' | 'denied' };
    const gateway = withOfflineAccessCache(
      fakeGateway(state),
      createInMemoryKvCache(),
    );
    await gateway.fetchCurrentAccess();
    state.mode = 'denied';
    const denied = await gateway.fetchCurrentAccess();
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.tag).toBe('app/access-denied');
  });
});
