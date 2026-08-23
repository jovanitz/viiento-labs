/**
 * Node-only entry point (`@acme/infrastructure-node`).
 *
 * The Postgres/Supabase adapters import the `postgres` driver, which depends
 * on Node built-ins and must never reach the browser bundles — that is why
 * they are excluded from the main barrel (see index.ts). Only Node-side
 * composition roots (apps/bison/api) may import this module.
 */
export * from './access/postgres/postgres-access-store';
export * from './billing/postgres/plan-catalog-store';
export * from './billing/postgres/subscription-store';

// Server-only auth adapters (node:crypto / admin secret key — never the browser).
export * from './auth/provisioning/node-secret-token-service';
export * from './auth/provisioning/supabase-admin-provisioner';
export * from './auth/provisioning/supabase-identity-purger';

// Supabase Storage adapter (SECRET key — server only).
export * from './storage/supabase-file-storage';

// Test plumbing for postgres specs in OTHER libs (verticals' stores share
// the same local database and must share the same advisory lock). No vitest
// import here, so it is safe to expose.
export * from './testing/postgres-test-env';
