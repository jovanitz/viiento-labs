import { ok } from '@acme/shared';
import type {
  CurrentAccessDto,
  CurrentAccessGateway,
  KvCache,
} from '@acme/application';

/**
 * Offline fallback for the session gate (ADR-0007, read phase): the last
 * successful `fetchCurrentAccess` snapshot is mirrored into a durable cache
 * and answers when the TRANSPORT fails (`app/access-gateway-error`), so the
 * app still opens past the gate without a connection. `app/access-denied`
 * is a server VERDICT and always passes through — caching must never keep
 * a revoked user in. Mutations (`revokeOwnSessions`) and the pre-auth
 * `needsBootstrap` probe are untouched.
 *
 * Known limit, on purpose: the cache is per browser profile, not per user —
 * fine for this single-account business app; revisit before multi-user
 * devices (invalidate on sign-out).
 */
type Envelope = { readonly at: string; readonly data: unknown };

export const withOfflineAccessCache = (
  gateway: CurrentAccessGateway,
  cache: KvCache,
  scope = 'access-cache',
): CurrentAccessGateway => ({
  ...gateway,
  fetchCurrentAccess: async () => {
    const key = `${scope}:current`;
    const result = await gateway.fetchCurrentAccess();
    if (result.ok) {
      try {
        const envelope: Envelope = {
          at: new Date().toISOString(),
          data: result.value,
        };
        await cache.set(key, JSON.stringify(envelope));
      } catch {
        // A cache that cannot write is just a cache we don't have.
      }
      return result;
    }
    if (result.error.tag !== 'app/access-gateway-error') return result;
    try {
      const hit = await cache.get(key);
      if (hit === null) return result;
      const envelope = JSON.parse(hit) as Envelope;
      return ok(envelope.data as CurrentAccessDto);
    } catch {
      return result;
    }
  },
});
