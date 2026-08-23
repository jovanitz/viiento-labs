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

  describe('issuance (live counter + snapshot round-trip)', () => {
    it('allocates monotonic folios atomically, per account', async () => {
      const world = await makeStore();
      const other = await makeStore();
      const folios = await Promise.all(
        Array.from({ length: 5 }, () => world.folios.next()),
      );
      expect([...folios].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
      expect(await other.folios.next()).toBe(1);
    });

    it('round-trips an issue, snapshot whole, and transitions in place', async () => {
      const world = await makeStore();
      const issue = {
        id: crypto.randomUUID(),
        entryId: crypto.randomUUID(),
        clientId: crypto.randomUUID(),
        folio: 1,
        issuedAt: '2026-08-21T18:00:00.000Z',
        issuedBy: 'user-1',
        status: 'issued',
        pdfPath: '',
        snapshot: {
          templateName: 'Evidencia',
          blocks: [],
          values: { b1: 'Consulta' },
          format: {
            id: crypto.randomUUID(),
            name: 'Receta',
            themeId: 'clinical',
            paper: 'letter',
            headerTokens: ['business.name'],
            footerTokens: ['document.folio'],
            marks: [],
            createdAt: '2026-08-21T18:00:00.000Z',
            updatedAt: '2026-08-21T18:00:00.000Z',
          },
          tokens: { 'document.folio': '0001' },
        },
      } as never;
      await world.issued.save(issue);
      const found = await world.issued.findById((issue as { id: never }).id);
      expect(found?.snapshot.values).toEqual({ b1: 'Consulta' });
      expect(found?.pdfPath).toBe('');
      await world.issued.save({ ...found, pdfPath: `issued/x` } as never);
      const listed = await world.issued.listByEntry(
        (issue as { entryId: string }).entryId,
      );
      expect(listed[0]?.pdfPath).toBe('issued/x');
    });
  });

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
