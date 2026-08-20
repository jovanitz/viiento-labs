import { createStore } from 'zustand/vanilla';
import type {
  BisonClientFlowDeps,
  ClientDetailVM,
  ClientsVM,
} from '@acme/bison-application';
import {
  createClient,
  loadClientDetail,
  loadClients,
  logTimelineEntry,
  updateClientContact,
} from '@acme/bison-application';

/**
 * The thin, reactive store for the Clients section. It holds the ViewModels
 * + loading/error and exposes actions that DELEGATE to the headless
 * controllers (flows/client/clients.ts). No flow logic lives here — every
 * action calls a controller, stores the result, and reloads what changed.
 */
export type ClientsStoreState = {
  readonly roster: ClientsVM | null;
  readonly detail: ClientDetailVM | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly load: () => Promise<void>;
  readonly open: (clientId: string) => Promise<void>;
  readonly back: () => void;
  readonly create: (input: {
    readonly name: string;
    readonly phone?: string;
  }) => Promise<boolean>;
  readonly saveContact: (input: {
    readonly id: string;
    readonly name: string;
    readonly phone: string;
  }) => Promise<boolean>;
  readonly logEntry: (input: {
    readonly templateId: string;
    readonly values: Readonly<Record<string, string>>;
  }) => Promise<boolean>;
};

export type ClientsStore = ReturnType<typeof createClientsStore>;

export const createClientsStore = (deps: BisonClientFlowDeps) =>
  createStore<ClientsStoreState>((set, get) => {
    const reloadRoster = async () => {
      const result = await loadClients(deps);
      set(
        result.ok
          ? { loading: false, error: null, roster: result.value }
          : { loading: false, error: result.error.message },
      );
    };
    const reloadDetail = async (clientId: string) => {
      const result = await loadClientDetail(deps, { clientId });
      set(
        result.ok
          ? { loading: false, error: null, detail: result.value }
          : { loading: false, error: result.error.message },
      );
      return result.ok;
    };

    return {
      roster: null,
      detail: null,
      loading: false,
      error: null,

      load: async () => {
        set({ loading: true });
        await reloadRoster();
      },
      open: async (clientId) => {
        set({ loading: true, detail: null });
        await reloadDetail(clientId);
      },
      back: () => {
        set({ detail: null });
        void get().load();
      },
      create: async (input) => {
        const result = await createClient(deps, input);
        if (!result.ok) {
          set({ error: result.error.message });
          return false;
        }
        await reloadRoster();
        return true;
      },
      saveContact: async ({ id, name, phone }) => {
        const result = await updateClientContact(deps, {
          id,
          changes: { name, phone },
        });
        if (!result.ok) {
          set({ error: result.error.message });
          return false;
        }
        return reloadDetail(id);
      },
      logEntry: async (input) => {
        const clientId = get().detail?.client.id;
        if (!clientId) return false;
        const result = await logTimelineEntry(deps, { clientId, ...input });
        if (!result.ok) {
          set({ error: result.error.message });
          return false;
        }
        return reloadDetail(clientId);
      },
    };
  });
