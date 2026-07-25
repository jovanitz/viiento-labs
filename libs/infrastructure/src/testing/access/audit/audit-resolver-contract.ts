import { describe, expect, it } from 'vitest';
import type { InMemoryAccessSeed } from '../../../access/in-memory/seed/access-seed';
import {
  accessContractSeed,
  makeAccessContractIds,
} from '../access-store-fixtures';
import type { AccessStorePorts } from '../access-store-fixtures';

/**
 * The audit label resolver — the read-side join — must behave identically for
 * both stores. Display labels (a member's email) are seeded differently across
 * stores, so this pins the structural join: which account/membership/session a
 * ref resolves to, not the exact human string (that varies with the seed).
 */
export const auditLabelResolverContract = (
  name: string,
  makeStore: (
    seed: InMemoryAccessSeed,
  ) => AccessStorePorts | Promise<AccessStorePorts>,
): void => {
  describe(`AuditLabelResolver contract: ${name}`, () => {
    it('joins account, membership, session and user refs to their entities', async () => {
      const ids = makeAccessContractIds();
      const store = await makeStore(accessContractSeed(ids));

      const labels = await store.auditLabelResolver.resolve(
        {
          memberships: [ids.membershipSupport],
          accounts: [ids.acctCustomer],
          users: [ids.userNew],
          sessions: [ids.sessionSupport],
        },
        null, // unrestricted (any-scope reader)
      );

      // A customer account resolves to its directory name + kind.
      expect(labels.accounts.get(ids.acctCustomer)).toEqual({
        name: 'Casa Pampa',
        kind: 'customer',
      });

      // A membership resolves to the account it belongs to.
      expect(labels.memberships.get(ids.membershipSupport)?.accountId).toBe(
        ids.acctSupport,
      );

      // A session resolves through to its membership, which the resolver
      // guarantees is also present in the memberships map (self-sufficient).
      expect(labels.sessions.get(ids.sessionSupport)?.membershipId).toBe(
        ids.membershipSupport,
      );
      expect(labels.memberships.has(ids.membershipSupport)).toBe(true);

      // A known user id is present in the users map.
      expect(labels.users.has(ids.userNew)).toBe(true);
    });

    it('returns empty maps for empty ref sets (no query, no crash)', async () => {
      const ids = makeAccessContractIds();
      const store = await makeStore(accessContractSeed(ids));
      const labels = await store.auditLabelResolver.resolve(
        { memberships: [], accounts: [], users: [], sessions: [] },
        null,
      );
      expect(labels.memberships.size).toBe(0);
      expect(labels.accounts.size).toBe(0);
      expect(labels.users.size).toBe(0);
      expect(labels.sessions.size).toBe(0);
    });

    it('omits unknown ids identically on both stores (no phantom entries)', async () => {
      const ids = makeAccessContractIds();
      const store = await makeStore(accessContractSeed(ids));
      const ghost = crypto.randomUUID();
      const labels = await store.auditLabelResolver.resolve(
        {
          memberships: [ghost],
          accounts: [ghost],
          users: [ghost],
          sessions: [ghost],
        },
        null,
      );
      expect(labels.memberships.has(ghost)).toBe(false);
      expect(labels.accounts.has(ghost)).toBe(false);
      expect(labels.users.has(ghost)).toBe(false);
      expect(labels.sessions.has(ghost)).toBe(false);
    });

    it('an own-scope viewer never resolves a cross-account label', async () => {
      const ids = makeAccessContractIds();
      const store = await makeStore(accessContractSeed(ids));
      // Viewer confined to the customer account. membershipSupport lives in the
      // STAFF account, so it must stay unresolved (→ falls back to its id); the
      // staff account name is withheld; user emails are never resolved.
      const labels = await store.auditLabelResolver.resolve(
        {
          memberships: [ids.membershipSupport],
          accounts: [ids.acctCustomer, ids.acctSupport],
          users: [ids.userNew],
          sessions: [],
        },
        ids.acctCustomer,
      );
      expect(labels.memberships.has(ids.membershipSupport)).toBe(false);
      expect(labels.accounts.has(ids.acctCustomer)).toBe(true);
      expect(labels.accounts.has(ids.acctSupport)).toBe(false);
      expect(labels.users.size).toBe(0);
    });
  });
};
