import type { FileStorage } from '@acme/application';
import type { BisonAccountStore } from '@acme/bison-infrastructure';
import { createInMemoryBisonStores } from '@acme/bison-infrastructure';
import { createPostgresBisonStore } from '@acme/bison-infrastructure-node';
import {
  createInMemoryFileStorage,
  withPathPrefix,
} from '@acme/infrastructure';
import { createSupabaseFileStorage } from '@acme/infrastructure-node';
import type { ApiConfig } from './config';

/** Supabase Storage bucket the migration provisions for captured files. */
const BISON_FILES_BUCKET = 'bison-files';

/**
 * The bison client's world, per account: repositories + file storage. Same
 * two axes as the access store — Postgres/Supabase when the env names them,
 * in-memory otherwise — decided here and nowhere else. `forAccount` is
 * called per request with the RESOLVED actor's account, so every repository
 * and every storage path is tenant-scoped by construction.
 */
export type BisonRuntime = {
  readonly forAccount: (accountId: string) => {
    readonly world: BisonAccountStore;
    readonly files: FileStorage;
  };
  readonly close: () => Promise<void>;
};

export const wireBison = (config: ApiConfig): BisonRuntime => {
  const stores = config.databaseUrl
    ? createPostgresBisonStore({ databaseUrl: config.databaseUrl })
    : { ...createInMemoryBisonStores(), close: undefined };

  const baseFiles: FileStorage =
    config.supabaseUrl && config.supabaseSecretKey
      ? createSupabaseFileStorage({
          supabaseUrl: config.supabaseUrl,
          serviceKey: config.supabaseSecretKey,
          bucket: BISON_FILES_BUCKET,
        })
      : createInMemoryFileStorage();

  return {
    forAccount: (accountId) => ({
      world: stores.forAccount(accountId),
      files: withPathPrefix(baseFiles, `accounts/${accountId}`),
    }),
    close: async () => {
      await stores.close?.();
    },
  };
};
