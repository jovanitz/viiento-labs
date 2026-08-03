import type {
  AccessClientUseCases,
  AccountAdminGateway,
  AuditGateway,
  BillingGateway,
  BlockUseCases,
  CoverageReader,
  DirectoryUseCases,
  InvitationsUseCases,
  MembersUseCases,
  OrgDetailGateway,
  RolesGateway,
  SessionsGateway,
  SettingsGateway,
} from '@acme/application';
import { createUseCasesSeam } from '@acme/ui';

/**
 * The Bison vertical's DI bundle ([ADR-0019](../../../../../docs/adr/0019-vertical-tag-axis.md)).
 *
 * Every field is REQUIRED, and that is the whole point. Bison ships one app, so
 * "wired" is not a spectrum: the composition root either builds the dashboard
 * or it does not. Under the old shared contract each of these was optional —
 * because the type also had to describe apps that wire almost none of them —
 * so every store hook re-checked bundles that are always present and returned
 * `null` for a state that could not occur, and each container rendered a branch
 * for it. Required fields delete that phantom state at the type level.
 *
 * Bison notably does NOT list `items` (a lab template feature) or `orgs` (the
 * lab client app). It used to instantiate a dead Item repository purely to
 * satisfy the shared type.
 */
export type BisonUseCases = {
  /** The caller's identity + permission checks behind every section gate. */
  readonly access: AccessClientUseCases;
  /** The staff/customer directory reads. */
  readonly directory: DirectoryUseCases;
  /** Per-account billing coverage (ADR-0018). */
  readonly coverage: CoverageReader;
  /** Issue invitations + activate them. */
  readonly invitations: InvitationsUseCases;
  /** List members + edit their permissions. */
  readonly members: MembersUseCases;
  /** Soft-block orgs / identities. */
  readonly block: BlockUseCases;
  /** Manage dynamic roles + their templates (ADR-0011, ADR-0013). */
  readonly roles: RolesGateway;
  /** Account lifecycle (disable/enable/promote). */
  readonly accounts: AccountAdminGateway;
  /** The security audit trail. */
  readonly audit: AuditGateway;
  /** List + revoke a member's sessions. */
  readonly sessions: SessionsGateway;
  /** Read + edit the session policy. */
  readonly settings: SettingsGateway;
  /** The org drill-down (summary + roster). */
  readonly orgDetail: OrgDetailGateway;
  /** Billing summary + levers + ledger (ADR-0018). */
  readonly billing: BillingGateway;
};

export const { UseCasesProvider, useUseCases } =
  createUseCasesSeam<BisonUseCases>();
