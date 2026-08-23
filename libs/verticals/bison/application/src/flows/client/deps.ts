import type { BisonClientGateway } from '../../client/gateway';

/**
 * The headless dependency bundle every client-app controller receives —
 * its own module so controllers can depend on it without depending on each
 * other (clients.ts ⇄ fill-files.ts would otherwise cycle).
 */
export type BisonClientFlowDeps = {
  readonly gateway: BisonClientGateway;
};
