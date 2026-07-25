import type { AccessAuditEvent, AccessAuditEventType } from '@acme/domain';
import type { AccessAuditRecord, AuditLabelRefs, AuditLabels } from './ports';

/**
 * Audit read-model projection — pure, total over the event union. Turns a raw
 * `AccessAuditRecord` (IDs only) into a view-ready row, resolving IDs to display
 * labels via the batch `AuditLabels` a resolver produced. No I/O, no framework:
 * the API layer and any future consumer project identically.
 */

export type AuditCategory =
  | 'access'
  | 'billing'
  | 'invites'
  | 'roles'
  | 'sessions';
export type AuditTargetKind = 'org' | 'staff' | 'identity';
export type AuditTargetView = {
  readonly kind: AuditTargetKind;
  readonly id: string;
  readonly label: string;
};
export type AuditEntryView = {
  readonly id: string;
  readonly type: AccessAuditEventType;
  readonly category: AuditCategory;
  readonly occurredAt: string;
  /** Who triggered it (email/label); null for system events. */
  readonly actor: string | null;
  /** The entity it acted on; null for global events (e.g. settings). */
  readonly target: AuditTargetView | null;
};

/** Which chip each event lands under. Exhaustive by the domain's type union. */
const CATEGORY_BY_TYPE: Record<AccessAuditEventType, AuditCategory> = {
  'login.succeeded': 'access',
  'login.failed': 'access',
  'account.disabled': 'access',
  'account.enabled': 'access',
  'account.promoted': 'access',
  'account.demoted': 'access',
  'account.deletion-scheduled': 'access',
  'account.deletion-canceled': 'access',
  'access.blocked': 'access',
  'access.unblocked': 'access',
  'identity.deleted': 'access',
  'member.removed': 'access',
  'owner.bootstrapped': 'access',
  'impersonation.started': 'access',
  'impersonation.ended': 'access',
  'permissions.updated': 'roles',
  'member.roles-assigned': 'roles',
  'invitation.created': 'invites',
  'invitation.accepted': 'invites',
  'invitation.revoked': 'invites',
  'session.revoked': 'sessions',
  'session.switched': 'sessions',
  'grant.expired': 'sessions',
  'settings.updated': 'sessions',
};

type Bucket = 'account' | 'membership' | 'user' | 'session' | 'email';
type TargetRef = { readonly bucket: Bucket; readonly id: string };

const blockRef = (
  kind: 'org' | 'identity' | 'membership',
  id: string,
): TargetRef => {
  if (kind === 'org') return { bucket: 'account', id };
  if (kind === 'identity') return { bucket: 'user', id };
  return { bucket: 'membership', id };
};

/** The entity each event points at (before resolution). Exhaustive by type. */
const TARGET_OF: {
  readonly [K in AccessAuditEventType]: (
    e: Extract<AccessAuditEvent, { readonly type: K }>,
  ) => TargetRef | null;
} = {
  'login.succeeded': (e) => ({ bucket: 'user', id: e.userId }),
  'login.failed': (e) => ({ bucket: 'email', id: e.attemptedIdentifier }),
  'account.disabled': (e) => ({ bucket: 'account', id: e.accountId }),
  'account.enabled': (e) => ({ bucket: 'account', id: e.accountId }),
  'account.promoted': (e) => ({ bucket: 'account', id: e.accountId }),
  'account.demoted': (e) => ({ bucket: 'account', id: e.accountId }),
  'account.deletion-scheduled': (e) => ({ bucket: 'account', id: e.accountId }),
  'account.deletion-canceled': (e) => ({ bucket: 'account', id: e.accountId }),
  'permissions.updated': (e) => ({ bucket: 'membership', id: e.membershipId }),
  'member.roles-assigned': (e) => ({
    bucket: 'membership',
    id: e.membershipId,
  }),
  'member.removed': (e) => ({ bucket: 'membership', id: e.membershipId }),
  'session.revoked': (e) => ({ bucket: 'session', id: e.sessionId }),
  'session.switched': (e) => ({ bucket: 'membership', id: e.toMembershipId }),
  'impersonation.started': (e) => ({
    bucket: 'account',
    id: e.targetAccountId,
  }),
  'impersonation.ended': (e) => ({ bucket: 'account', id: e.targetAccountId }),
  'grant.expired': (e) => ({ bucket: 'account', id: e.targetAccountId }),
  'invitation.created': (e) => ({ bucket: 'email', id: e.email }),
  'invitation.revoked': (e) => ({ bucket: 'email', id: e.email }),
  'invitation.accepted': (e) => ({ bucket: 'membership', id: e.membershipId }),
  'identity.deleted': (e) =>
    e.email
      ? { bucket: 'email', id: e.email }
      : { bucket: 'user', id: e.userId },
  'owner.bootstrapped': (e) => ({ bucket: 'membership', id: e.membershipId }),
  'access.blocked': (e) => blockRef(e.subjectKind, e.subjectId),
  'access.unblocked': (e) => blockRef(e.subjectKind, e.subjectId),
  'settings.updated': () => null,
};

const targetRefOf = (event: AccessAuditEvent): TargetRef | null =>
  (TARGET_OF[event.type] as (e: AccessAuditEvent) => TargetRef | null)(event);

const actorOf = (event: AccessAuditEvent): string | null =>
  'actorMembershipId' in event ? event.actorMembershipId : null;

type RefSets = {
  readonly memberships: Set<string>;
  readonly accounts: Set<string>;
  readonly users: Set<string>;
  readonly sessions: Set<string>;
};

const addRef = (sets: RefSets, ref: TargetRef): void => {
  switch (ref.bucket) {
    case 'account':
      return void sets.accounts.add(ref.id);
    case 'membership':
      return void sets.memberships.add(ref.id);
    case 'user':
      return void sets.users.add(ref.id);
    case 'session':
      return void sets.sessions.add(ref.id);
    case 'email':
      return; // the id IS the label — nothing to resolve
  }
};

/** Every distinct id the batch of records references, de-duplicated per bucket. */
export const collectAuditRefs = (
  records: ReadonlyArray<AccessAuditRecord>,
): AuditLabelRefs => {
  const sets: RefSets = {
    memberships: new Set(),
    accounts: new Set(),
    users: new Set(),
    sessions: new Set(),
  };
  for (const { event } of records) {
    const actor = actorOf(event);
    if (actor) sets.memberships.add(actor);
    const ref = targetRefOf(event);
    if (ref) addRef(sets, ref);
  }
  return {
    memberships: [...sets.memberships],
    accounts: [...sets.accounts],
    users: [...sets.users],
    sessions: [...sets.sessions],
  };
};

const orgKind = (kind?: 'staff' | 'customer'): AuditTargetKind =>
  kind === 'staff' ? 'staff' : 'org';

const accountTarget = (id: string, labels: AuditLabels): AuditTargetView => {
  const a = labels.accounts.get(id);
  return { kind: orgKind(a?.kind), id, label: a?.name ?? id };
};

const membershipTarget = (id: string, labels: AuditLabels): AuditTargetView => {
  const m = labels.memberships.get(id);
  return { kind: orgKind(m?.kind), id, label: m?.label ?? id };
};

const sessionTarget = (id: string, labels: AuditLabels): AuditTargetView => {
  const s = labels.sessions.get(id);
  const m = s ? labels.memberships.get(s.membershipId) : undefined;
  return {
    kind: m?.kind === 'staff' ? 'staff' : 'identity',
    id,
    label: m?.label ?? id,
  };
};

const identityTarget = (id: string, labels: AuditLabels): AuditTargetView => {
  const u = labels.users.get(id);
  return { kind: 'identity', id, label: u?.email ?? id };
};

const targetView = (ref: TargetRef, labels: AuditLabels): AuditTargetView => {
  switch (ref.bucket) {
    case 'account':
      return accountTarget(ref.id, labels);
    case 'membership':
      return membershipTarget(ref.id, labels);
    case 'session':
      return sessionTarget(ref.id, labels);
    case 'user':
    case 'email':
      return identityTarget(ref.id, labels);
  }
};

/** Project one raw record to a view-ready row using resolved labels. */
export const projectAuditEvent = (
  record: AccessAuditRecord,
  labels: AuditLabels,
): AuditEntryView => {
  const { id, event } = record;
  const actorId = actorOf(event);
  const ref = targetRefOf(event);
  return {
    id,
    type: event.type,
    category: CATEGORY_BY_TYPE[event.type],
    occurredAt: event.occurredAt,
    actor: actorId ? (labels.memberships.get(actorId)?.label ?? actorId) : null,
    target: ref ? targetView(ref, labels) : null,
  };
};
