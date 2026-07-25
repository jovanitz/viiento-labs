import type { AccessAuditEvent, AccessAuditEventType } from '@acme/domain';

/**
 * The append-only audit trail.
 *
 * `append` exists for events that are not the by-product of a sensitive write
 * (e.g. `login.succeeded` / `login.failed`, recorded by the API layer).
 * Events that DO accompany a mutation are persisted transactionally by the
 * write ports themselves — they all land in the same trail this port reads.
 */
export type AccessAuditRecord = {
  readonly id: string;
  readonly event: AccessAuditEvent;
};

export type AccessAuditFilter = {
  readonly types?: ReadonlyArray<AccessAuditEventType>;
  readonly accountId?: string;
  readonly limit?: number;
  /**
   * Order by append ordinal DESCENDING (newest first) so `limit` returns the
   * most recent N — what a "recent events" view wants. Defaults to ascending
   * (append order), which every existing reader relies on; only the dashboard
   * read model opts in.
   */
  readonly newestFirst?: boolean;
};

export type AccessAuditTrail = {
  readonly append: (event: AccessAuditEvent) => Promise<void>;
  /** Most-recent-first; `limit` therefore returns the newest N (see adapters). */
  readonly list: (
    filter?: AccessAuditFilter,
  ) => Promise<ReadonlyArray<AccessAuditRecord>>;
};

/**
 * Batch label resolution for the audit read model. Events store IDs, never
 * display strings (they are pure domain data). The read model collects every
 * referenced id once and resolves them here so the trail can be rendered with
 * human names — a server-side join the client never has to make.
 */
export type AuditLabelRefs = {
  readonly memberships: ReadonlyArray<string>;
  readonly accounts: ReadonlyArray<string>;
  readonly users: ReadonlyArray<string>;
  readonly sessions: ReadonlyArray<string>;
};

export type ResolvedMembership = {
  /** The member's display label — their email (or the id, if unknown). */
  readonly label: string;
  readonly accountId: string;
  readonly accountName: string | null;
  readonly kind: 'staff' | 'customer';
};
export type ResolvedAccount = {
  readonly name: string | null;
  readonly kind: 'staff' | 'customer';
};
export type ResolvedUser = { readonly email: string | null };
/** A session resolves to the membership it belonged to (then to that member). */
export type ResolvedSession = { readonly membershipId: string };

export type AuditLabels = {
  readonly memberships: ReadonlyMap<string, ResolvedMembership>;
  readonly accounts: ReadonlyMap<string, ResolvedAccount>;
  readonly users: ReadonlyMap<string, ResolvedUser>;
  readonly sessions: ReadonlyMap<string, ResolvedSession>;
};

/**
 * Resolves a batch of audit refs to display labels (a read-only join).
 *
 * `viewerAccountId` scopes what may be resolved to a human label: `null` means
 * unrestricted (an `any`-scope platform reader may see the whole graph); a
 * value restricts resolution to entities in THAT account, so an `own`-scope
 * reader (an org admin reading their own slice) never gets a cross-account
 * actor/target resolved — those fall back to their opaque id, exactly as the
 * pre-enrichment trail did. This is the boundary that stops staff emails from
 * leaking to a customer via an event that merely touched their account.
 */
export type AuditLabelResolver = {
  readonly resolve: (
    refs: AuditLabelRefs,
    viewerAccountId: string | null,
  ) => Promise<AuditLabels>;
};
