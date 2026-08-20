// Browser-safe barrel: the in-memory reference store and the client-side
// RPC gateway. The Postgres store (./persistence/postgres/*) imports the
// Node-only `postgres` driver and ships through ./node.ts
// (`@acme/bison-infrastructure-node`) instead.
export * from './persistence/in-memory-bison-store';
export * from './client/rpc-bison-gateway';
