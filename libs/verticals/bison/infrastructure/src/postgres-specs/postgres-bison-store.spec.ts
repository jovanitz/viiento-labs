import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres from 'postgres';
import {
  POSTGRES_TEST_URL,
  acquirePostgresTestLock,
  probePostgres,
} from '@acme/infrastructure-node';
import { bisonAgendaContract } from '../testing/bison-agenda-contract';
import { bisonFormatsContract } from '../testing/bison-formats-contract';
import { bisonIdentityContract } from '../testing/bison-identity-contract';
import { bisonStoreContract, template } from '../testing/bison-store-contract';
import { createPostgresBisonStore } from '../persistence/postgres/postgres-bison-store';

/**
 * Runs the SAME contract as the in-memory store against the local Supabase
 * Postgres (no credentials — well-known local dev connection). Skips with a
 * visible notice when the stack is down. Every `makeStore` call creates a
 * FRESH account row and scopes the store to it, so tests isolate by tenancy
 * instead of wiping shared tables.
 */
const available = await probePostgres();

if (available) {
  const store = createPostgresBisonStore({
    databaseUrl: POSTGRES_TEST_URL,
    maxConnections: 4,
  });
  const sql = postgres(POSTGRES_TEST_URL, {
    max: 1,
    onnotice: () => undefined,
  });
  let releaseLock: (() => Promise<void>) | null = null;
  beforeAll(async () => {
    releaseLock = await acquirePostgresTestLock();
  }, 60_000);
  afterAll(async () => {
    await store.close();
    await sql.end();
    await releaseLock?.();
  });

  const makeStore = async () => {
    const accountId = crypto.randomUUID();
    await sql`
      insert into public.accounts (id, display_name, kind)
      values (${accountId}, 'Bison contract world', 'customer')
    `;
    return store.forAccount(accountId);
  };

  bisonStoreContract('postgres (supabase local)', makeStore);
  bisonAgendaContract('postgres (supabase local)', makeStore);
  bisonFormatsContract('postgres (supabase local)', makeStore);
  bisonIdentityContract('postgres (supabase local)', makeStore);

  describe('account scoping', () => {
    it('never leaks rows across accounts', async () => {
      const one = await makeStore();
      const other = await makeStore();
      const saved = template();
      await one.templates.save(saved);

      expect(await other.templates.findById(saved.id)).toBeNull();
      expect(await other.templates.list()).toEqual([]);
    });
  });
} else {
  describe('BisonAccountStore contract: postgres (supabase local)', () => {
    it('skipped — local Supabase is not running (`supabase start`)', (ctx) => {
      ctx.skip();
      expect(available).toBe(true);
    });
  });
}
