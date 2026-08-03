import type {
  AccessClientUseCases,
  AccountAdminGateway,
  AuditGateway,
  BlockUseCases,
  DirectoryUseCases,
  InvitationsUseCases,
  ItemUseCases,
  MembersUseCases,
  OrgsUseCases,
  RolesGateway,
  SessionsGateway,
  SettingsGateway,
} from '@acme/application';
import { createUseCasesSeam } from '@acme/ui';

/**
 * The LAB vertical's DI bundle ([ADR-0019](../../../../../docs/adr/0019-vertical-tag-axis.md)).
 *
 * The optional fields are legitimate here in a way they were not in the old
 * shared `AppUseCases`: lab is ONE vertical shipping five apps (web, dashboard,
 * client, desktop, mobile) over one bundle, and no single app wires them all.
 * Contrast `BisonUseCases`, which ships one app and so requires every field.
 * Splitting this per app would remove the last of the optionals — worth doing
 * if lab's apps ever diverge further.
 */
export type LabUseCases = {
  readonly items: ItemUseCases;
  /** Present once the app wires auth (web today; mobile/desktop pending). */
  readonly access?: AccessClientUseCases;
  /** Staff dashboard: the staff/customer directory reads. */
  readonly directory?: DirectoryUseCases;
  /** Staff dashboard: issue invitations + activate them. */
  readonly invitations?: InvitationsUseCases;
  /** Staff dashboard: list members + edit their permissions. */
  readonly members?: MembersUseCases;
  /** Staff dashboard: soft-block orgs / identities. */
  readonly block?: BlockUseCases;
  /** Staff dashboard: manage dynamic roles (ADR-0011). */
  readonly roles?: RolesGateway;
  /** Staff dashboard: account lifecycle (disable/enable/promote). */
  readonly accounts?: AccountAdminGateway;
  /** Staff dashboard: read the security audit trail. */
  readonly audit?: AuditGateway;
  /** Staff dashboard: list + revoke a member's sessions. */
  readonly sessions?: SessionsGateway;
  /** Staff dashboard: read + edit the session policy. */
  readonly settings?: SettingsGateway;
  /** Client app: the caller's orgs + switching between them. */
  readonly orgs?: OrgsUseCases;
};

export const { UseCasesProvider, useUseCases } =
  createUseCasesSeam<LabUseCases>();
