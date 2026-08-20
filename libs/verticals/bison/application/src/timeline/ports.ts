import type { ClientId, Entry } from '@acme/bison-domain';

/**
 * Repository port for a client's running record. Entries are append-only
 * from the application's point of view — corrections arrive as new entries,
 * so the record stays an honest history. `listByClient` returns newest
 * first (the timeline's reading order).
 */
export type EntryRepository = {
  readonly append: (entry: Entry) => Promise<void>;
  readonly listByClient: (clientId: ClientId) => Promise<ReadonlyArray<Entry>>;
};
