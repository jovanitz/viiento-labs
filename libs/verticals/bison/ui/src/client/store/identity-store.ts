import { createStore } from 'zustand/vanilla';
import type { BisonClientFlowDeps } from '@acme/bison-application';
import { loadAccountTokens } from '@acme/bison-application';

/**
 * Reactive store for the account's document tokens (`business.*`) — what
 * the Document screen resolves its letterhead from. Read-only for now:
 * editing the identity arrives with the Settings design; the backend
 * (`bison.identity.update`) is already there for it and for the bot.
 */
export type IdentityStoreState = {
  /** Token values for composeModel; null until loaded. Unreachable
   *  backend degrades to {} — the page prints no letterhead, never an
   *  invented one. */
  readonly tokens: Readonly<Record<string, string>> | null;
  readonly load: () => Promise<void>;
};

export const createIdentityStore = (deps: BisonClientFlowDeps) =>
  createStore<IdentityStoreState>((set) => ({
    tokens: null,
    load: async () => {
      const result = await loadAccountTokens(deps);
      set({ tokens: result.ok ? result.value : {} });
    },
  }));

export type IdentityStore = ReturnType<typeof createIdentityStore>;
