/**
 * Audit screen view-model contract. The store maps the server-enriched
 * `AuditRecordDto` (category + resolved actor/target labels) onto these rows;
 * the view stays presentational and reads them.
 */
export type AuditCategory =
  | 'access'
  | 'billing'
  | 'invites'
  | 'roles'
  | 'sessions';

export type AuditTarget = {
  readonly label: string;
  readonly kind: 'org' | 'staff' | 'identity';
  readonly id?: string;
};

export type AuditRow = {
  readonly id: string;
  /** Machine event code, e.g. `access.blocked` — the append-only truth. */
  readonly type: string;
  readonly category: AuditCategory;
  /** Who triggered the event (display name / email); system events have none. */
  readonly actor?: string;
  /** The entity the event acted on — links back to its detail. */
  readonly target?: AuditTarget;
  readonly occurredAt: string;
};

export type AuditVM = {
  readonly entries: readonly AuditRow[];
  readonly loading?: boolean;
  /** The actor lacks `audit.read` — the trail is hidden, not empty. */
  readonly hidden?: boolean;
  readonly error?: string;
};

export type AuditActions = {
  readonly onOpenTarget?: ((row: AuditRow) => void) | undefined;
};
