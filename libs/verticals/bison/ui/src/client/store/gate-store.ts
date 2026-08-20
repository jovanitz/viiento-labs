import { createStore } from 'zustand/vanilla';
import {
  type AccessClientUseCases,
  type ClientGateState,
  resolveClientGate,
} from '@acme/application';

/**
 * Reactive store for the client app's session gate. Dumb by design: the
 * decision (anonymous / no-org / blocked / authenticated) is
 * `resolveClientGate`, a headless controller shared by every vertical —
 * this only caches its answer and re-runs it when auth changes. Same
 * binding-per-vertical reasoning as the dashboard's admin gate (ADR-0019).
 */
export type ClientGateStoreState = {
  readonly gate: ClientGateState | 'loading';
  readonly resolve: () => Promise<void>;
  /** Subscribe to auth changes → re-resolve. Returns an unsubscribe. */
  readonly subscribe: () => () => void;
  readonly signOut: () => Promise<void>;
};

export const createClientGateStore = (deps: {
  readonly access: AccessClientUseCases;
}) =>
  createStore<ClientGateStoreState>((set) => {
    const doResolve = async () => set({ gate: await resolveClientGate(deps) });
    return {
      gate: 'loading',
      resolve: doResolve,
      subscribe: () => deps.access.onAuthChange(() => void doResolve()),
      signOut: () => deps.access.signOut(),
    };
  });

export type ClientGateStore = ReturnType<typeof createClientGateStore>;
