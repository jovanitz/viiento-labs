import type {
  AuditLabelRefs,
  AuditLabelResolver,
  AuditLabels,
  ResolvedAccount,
  ResolvedMembership,
  ResolvedSession,
  ResolvedUser,
} from '@acme/application';
import type { Sql } from 'postgres';
import { isUuid } from './rows';

/**
 * Postgres audit label resolver — the read-side join for the enriched trail.
 * Resolves the ids an audit event carries to display labels: memberships and
 * accounts join to `accounts.display_name`, users to `auth.users.email`, and a
 * session resolves through to the membership it belonged to (then to that
 * member). Ids are UUID-guarded so a malformed payload id never casts-errors.
 *
 * `viewerAccountId` scopes resolution: null = unrestricted (any-scope reader);
 * a value confines membership/account/user resolution to that account, so an
 * own-scope reader never resolves a cross-account actor to its email.
 */

const kindOf = (k: unknown): 'staff' | 'customer' =>
  k === 'staff' ? 'staff' : 'customer';

const uuids = (ids: ReadonlyArray<string>): string[] => ids.filter(isUuid);

const membershipRows = async (
  sql: Sql,
  ids: ReadonlyArray<string>,
  viewerAccountId: string | null,
): Promise<Map<string, ResolvedMembership>> => {
  const list = uuids(ids);
  if (list.length === 0) return new Map();
  const rows = await sql`
    select m.id, m.user_id, m.account_id, a.display_name, a.kind, u.email
    from public.memberships m
    join public.accounts a on a.id = m.account_id
    join auth.users u on u.id = m.user_id
    where m.id in ${sql(list)}
    ${viewerAccountId ? sql`and m.account_id = ${viewerAccountId}` : sql``}
  `;
  return new Map(
    rows.map((r) => [
      r['id'] as string,
      {
        label: (r['email'] as string | null) ?? (r['user_id'] as string),
        accountId: r['account_id'] as string,
        accountName: (r['display_name'] as string | null) ?? null,
        kind: kindOf(r['kind']),
      },
    ]),
  );
};

const accountRows = async (
  sql: Sql,
  ids: ReadonlyArray<string>,
  viewerAccountId: string | null,
): Promise<Map<string, ResolvedAccount>> => {
  const list = uuids(ids).filter(
    (id) => !viewerAccountId || id === viewerAccountId,
  );
  if (list.length === 0) return new Map();
  const rows = await sql`
    select id, display_name, kind from public.accounts where id in ${sql(list)}
  `;
  return new Map(
    rows.map((r) => [
      r['id'] as string,
      {
        name: (r['display_name'] as string | null) ?? null,
        kind: kindOf(r['kind']),
      },
    ]),
  );
};

const userRows = async (
  sql: Sql,
  ids: ReadonlyArray<string>,
  viewerAccountId: string | null,
): Promise<Map<string, ResolvedUser>> => {
  // A user is not account-scoped here, so an own-scope reader resolves none.
  if (viewerAccountId) return new Map();
  const list = uuids(ids);
  if (list.length === 0) return new Map();
  const rows =
    await sql`select id, email from auth.users where id in ${sql(list)}`;
  return new Map(
    rows.map((r) => [
      r['id'] as string,
      { email: (r['email'] as string | null) ?? null },
    ]),
  );
};

const sessionRows = async (
  sql: Sql,
  ids: ReadonlyArray<string>,
): Promise<Map<string, ResolvedSession>> => {
  const list = uuids(ids);
  if (list.length === 0) return new Map();
  const rows = await sql`
    select id, membership_id from public.sessions where id in ${sql(list)}
  `;
  return new Map(
    rows.map((r) => [
      r['id'] as string,
      { membershipId: r['membership_id'] as string },
    ]),
  );
};

export const createPostgresAuditLabelResolver = (
  sql: Sql,
): AuditLabelResolver => ({
  resolve: async (
    refs: AuditLabelRefs,
    viewerAccountId: string | null,
  ): Promise<AuditLabels> => {
    const sessions = await sessionRows(sql, refs.sessions);
    const membershipIds = [
      ...new Set([
        ...refs.memberships,
        ...[...sessions.values()].map((s) => s.membershipId),
      ]),
    ];
    const [memberships, accounts, users] = await Promise.all([
      membershipRows(sql, membershipIds, viewerAccountId),
      accountRows(sql, refs.accounts, viewerAccountId),
      userRows(sql, refs.users, viewerAccountId),
    ]);
    return { memberships, accounts, users, sessions };
  },
});
