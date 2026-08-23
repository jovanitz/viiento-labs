import { describe, expect, it } from 'vitest';
import type { KvCache } from '@acme/application';

/**
 * Shared behavioral contract for `KvCache` adapters — the in-memory
 * reference and Dexie must be indistinguishable to a caller. NOT exported
 * from the barrel (imports vitest); specs import it relatively.
 */
export const kvCacheContract = (
  adapterName: string,
  makeCache: () => KvCache | Promise<KvCache>,
): void => {
  describe(`KvCache contract — ${adapterName}`, () => {
    it('misses with null, never throws', async () => {
      const cache = await makeCache();
      expect(await cache.get('nope')).toBeNull();
    });

    it('round-trips a value', async () => {
      const cache = await makeCache();
      await cache.set('k1', '{"at":"2026-08-20","data":[1,2]}');
      expect(await cache.get('k1')).toBe('{"at":"2026-08-20","data":[1,2]}');
    });

    it('overwrites in place — last write wins', async () => {
      const cache = await makeCache();
      await cache.set('k1', 'old');
      await cache.set('k1', 'new');
      expect(await cache.get('k1')).toBe('new');
    });

    it('keeps keys isolated', async () => {
      const cache = await makeCache();
      await cache.set('a', '1');
      await cache.set('b', '2');
      expect(await cache.get('a')).toBe('1');
      expect(await cache.get('b')).toBe('2');
    });
  });
};
