import { createStore } from 'zustand/vanilla';
import {
  type AccessClientUseCases,
  type AdminGateState,
  resolveAdminGate,
} from '@acme/application';

/**
 * Reactive store for Bison's staff route gate. Dumb by design: the decision
 * (anonymous / forbidden / blocked / authorized) is `resolveAdminGate`, a
 * headless controller in `application` shared by every vertical — this only
 * caches its answer and re-runs it when auth changes.
 *
 * The binding is per-vertical ([ADR-0019](../../../../../../../docs/adr/0019-vertical-tag-axis.md)):
 * Bison owns its gate end-to-end rather than borrowing the lab template's, so
 * moving lab out cannot take Bison's authentication with it. What is NOT
 * duplicated is the rule itself.
 */
export type AdminGateStoreState = {
  readonly gate: AdminGateState | 'loading';
  readonly resolve: () => Promise<void>;
  /** Subscribe to auth changes → re-resolve. Returns an unsubscribe. */
  readonly subscribe: () => () => void;
  readonly signOut: () => Promise<void>;
};

export const createAdminGateStore = (deps: {
  readonly access: AccessClientUseCases;
}) =>
  createStore<AdminGateStoreState>((set) => {
    const doResolve = async () => set({ gate: await resolveAdminGate(deps) });
    return {
      gate: 'loading',
      resolve: doResolve,
      subscribe: () => deps.access.onAuthChange(() => void doResolve()),
      signOut: () => deps.access.signOut(),
    };
  });

export type AdminGateStore = ReturnType<typeof createAdminGateStore>;
