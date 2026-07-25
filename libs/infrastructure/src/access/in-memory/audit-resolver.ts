import type {
  AuditLabelRefs,
  AuditLabelResolver,
  AuditLabels,
  ResolvedMembership,
} from '@acme/application';
import { accountKindOf } from './seed/access-seed';
import type { AccessStoreState } from './seed/access-seed';

/**
 * In-memory audit label resolver — the read-side join the enriched trail needs.
 * Turns the ids an audit event carries (membership / account / user / session)
 * into display labels by reading the same store the write ports use. Staff
 * account names are not held in memory (only the customer directory is), so a
 * staff account target falls back to its id — the read model tolerates that.
 */

const emailOf = (state: AccessStoreState, userId: string): string | null =>
  state.users.get(userId)?.email ?? null;

const accountName = (
  state: AccessStoreState,
  accountId: string,
): string | null => state.customers.get(accountId)?.displayName ?? null;

// `viewerAccountId === null` → unrestricted (any-scope reader). Otherwise only
// entities in that account may resolve to a label; cross-account refs are left
// out and fall back to their opaque id (see AuditLabelResolver in ports.ts).
const inScope = (viewerAccountId: string | null, accountId: string): boolean =>
  viewerAccountId === null || accountId === viewerAccountId;

const membershipLabel = (
  state: AccessStoreState,
  membershipId: string,
  viewerAccountId: string | null,
): ResolvedMembership | null => {
  const m = state.memberships.get(membershipId);
  if (!m || !inScope(viewerAccountId, m.accountId)) return null;
  return {
    label: emailOf(state, m.userId) ?? m.userId,
    accountId: m.accountId,
    accountName: accountName(state, m.accountId),
    kind: accountKindOf(state, m.accountId),
  };
};

export const makeInMemoryAuditLabelResolver = (
  state: AccessStoreState,
): AuditLabelResolver => ({
  resolve: async (
    refs: AuditLabelRefs,
    viewerAccountId: string | null,
  ): Promise<AuditLabels> => {
    const sessions = new Map<string, { readonly membershipId: string }>();
    const membershipIds = new Set(refs.memberships);
    for (const sid of refs.sessions) {
      const s = state.sessions.get(sid);
      if (!s) continue;
      sessions.set(sid, { membershipId: s.membershipId });
      membershipIds.add(s.membershipId);
    }
    const memberships = new Map<string, ResolvedMembership>();
    for (const mid of membershipIds) {
      const resolved = membershipLabel(state, mid, viewerAccountId);
      if (resolved) memberships.set(mid, resolved);
    }
    return {
      memberships,
      accounts: new Map(
        // Only accounts that EXIST resolve — an unknown id is omitted (matching
        // Postgres, which simply returns no row), so the projector falls back to
        // the id with a consistent default kind on both stores.
        refs.accounts
          .filter(
            (aid) => inScope(viewerAccountId, aid) && state.accounts.has(aid),
          )
          .map((aid) => [
            aid,
            { name: accountName(state, aid), kind: accountKindOf(state, aid) },
          ]),
      ),
      // An own-scope reader never resolves user emails (a user is not account-
      // scoped here); such targets fall back to their id. Unknown users are
      // omitted, like Postgres.
      users:
        viewerAccountId === null
          ? new Map(
              refs.users
                .filter((uid) => state.users.has(uid))
                .map((uid) => [uid, { email: emailOf(state, uid) }]),
            )
          : new Map(),
      sessions,
    };
  },
});
