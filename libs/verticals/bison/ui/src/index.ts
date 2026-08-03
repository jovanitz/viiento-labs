/**
 * `@acme/bison-ui` — the Bison vertical's screens (ADR-0019).
 *
 * Its own Nx project, tagged `vertical:bison`, so the boundary rule keeps it
 * out of the shared libs and out of every sibling vertical. It consumes the
 * design system the way any other consumer does — through `@acme/ui` — rather
 * than by walking up the source tree.
 */

// The vertical's DI bundle + its seam instance.
export * from './di';

// The app shell (sidebar + topbar + bottom nav chrome).
export * from './dashboard/dashboard.shell';

// The vertical's own staff gate + sign-in (ADR-0019): Bison authenticates
// through its own screens, not the lab template's.
export * from './dashboard/gate/gate.container';
export * from './dashboard/login/login.container';

// Wired sections — each a `*.container` seam over an approved view
// (ADR-0018 billing coverage; docs/ai/screens.md for the two-phase workflow).
export * from './dashboard/directory/directory.container';
export * from './dashboard/plans/plans.container';
export * from './dashboard/roles/roles.container';
export * from './dashboard/roles/templates.container';
export * from './dashboard/settings/settings.container';
export * from './dashboard/audit/audit.container';
export * from './dashboard/permissions/permissions.container';
export * from './dashboard/org-detail/org-detail.container';
