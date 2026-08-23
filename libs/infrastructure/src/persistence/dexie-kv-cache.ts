import Dexie, { type Table } from 'dexie';
import type { KvCache } from '@acme/application';

/**
 * IndexedDB-backed `KvCache` (Dexie) — the durable store behind offline
 * read caches. One `kv` table keyed by `key`; values are opaque strings.
 * Own database per cache name, so wiping one feature's cache never touches
 * another's. Migration discipline as in dexie-db.ts: the stores() string
 * declares keys only; add versions, never edit one in place.
 */
type KvRow = { readonly key: string; readonly value: string };

type KvDatabase = Dexie & { kv: Table<KvRow, string> };

export const createDexieKvCache = (name: string): KvCache => {
  const db = new Dexie(name) as KvDatabase;
  db.version(1).stores({ kv: 'key' });
  return {
    get: async (key) => (await db.kv.get(key))?.value ?? null,
    set: async (key, value) => {
      await db.kv.put({ key, value });
    },
  };
};
