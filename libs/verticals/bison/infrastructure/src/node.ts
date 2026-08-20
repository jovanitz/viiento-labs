/**
 * Node-only entry point (`@acme/bison-infrastructure-node`) — same rule as
 * the core `@acme/infrastructure-node`: the Postgres adapter imports the
 * `postgres` driver, which must never reach a browser bundle. Only the
 * Node-side composition root (apps/bison/api) imports this module.
 */
export * from './persistence/postgres/postgres-bison-store';
