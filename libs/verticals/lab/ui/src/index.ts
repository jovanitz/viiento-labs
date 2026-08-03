/**
 * `@acme/lab-ui` — the LAB vertical's screens ([ADR-0019](../../../../../docs/adr/0019-vertical-tag-axis.md)).
 *
 * Lab is the reference implementation of a vertical, not a junk drawer: it owns
 * a complete world (the canonical `Item` feature across web/desktop/mobile, a
 * staff dashboard, a customer client) so "stand up a new vertical" means "copy
 * lab". It is also the canary — if bison-specific code leaks into the shared
 * libs, lab stops compiling long before a second real vertical exists.
 */

// The vertical's DI bundle + its seam instance.
export * from './di';

// Canonical template feature: the Item slice threaded through every layer.
export * from './example/use-items';
export * from './example/item-form';
export * from './example/item-screen';

// Functional login/access skeleton.
export * from './access/access-login-screen';

// Staff dashboard: auth gate + directory tables.
export * from './dashboard/login-screen';
export * from './dashboard/require-admin';
export * from './dashboard/dashboard-screen';
export * from './dashboard/invitations/invite-member-form';
export * from './dashboard/permissions/manage-permissions-form';
export * from './dashboard/block/block-buttons';

// Client app: customer-facing self-serve (signup, home, org switcher).
export * from './client/client-login-screen';
export * from './client/client-home-screen';
export * from './client/require-session';
export * from './client/manage-org/manage-org-section';
