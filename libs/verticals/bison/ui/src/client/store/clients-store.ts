import { createStore } from 'zustand/vanilla';
import type {
  BisonClientFlowDeps,
  ClientDetailVM,
  ClientRowVM,
  ClientsVM,
} from '@acme/bison-application';
import {
  createClient,
  getFileUrl,
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
    readonly photoDataUrl?: string;
  }) => Promise<boolean>;
  readonly saveContact: (input: {
    readonly id: string;
    readonly name: string;
    readonly phone: string;
    readonly photoDataUrl?: string;
  }) => Promise<boolean>;
  readonly logEntry: (input: {
    readonly templateId: string;
    readonly values: Readonly<Record<string, string>>;
  }) => Promise<boolean>;
  /** Signed URL for a stored file value, or null when unreachable. */
  readonly fileUrl: (storagePath: string) => Promise<string | null>;
};

export type ClientsStore = ReturnType<typeof createClientsStore>;

const fileUrlOn = async (
  deps: BisonClientFlowDeps,
  storagePath: string,
): Promise<string | null> => {
  const result = await getFileUrl(deps, { storagePath });
  return result.ok ? result.value : null;
};

/** Photos persist as storage paths; the avatar needs a URL — resolve a
 *  short-lived signed one per row (missing/unreachable → initials). */
const withPhotoUrl = async (
  deps: BisonClientFlowDeps,
  row: ClientRowVM,
): Promise<ClientRowVM> => {
  if (!row.photoPath) return row;
  const url = await fileUrlOn(deps, row.photoPath);
  return url ? { ...row, photoUrl: url } : row;
};

type Patch = (partial: Partial<ClientsStoreState>) => void;

const rosterReload = async (deps: BisonClientFlowDeps, set: Patch) => {
  const result = await loadClients(deps);
  if (!result.ok) {
    set({ loading: false, error: result.error.message });
    return;
  }
  const clients = await Promise.all(
    result.value.clients.map((row) => withPhotoUrl(deps, row)),
  );
  set({ loading: false, error: null, roster: { ...result.value, clients } });
};

const detailReload = async (
  deps: BisonClientFlowDeps,
  set: Patch,
  clientId: string,
) => {
  const result = await loadClientDetail(deps, { clientId });
  if (!result.ok) {
    set({ loading: false, error: result.error.message });
    return false;
  }
  const client = await withPhotoUrl(deps, result.value.client);
  set({ loading: false, error: null, detail: { ...result.value, client } });
  return true;
};

export const createClientsStore = (deps: BisonClientFlowDeps) =>
  createStore<ClientsStoreState>((set, get) => {
    const reloadRoster = () => rosterReload(deps, set);
    const reloadDetail = (clientId: string) => detailReload(deps, set, clientId);

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
      saveContact: async ({ id, name, phone, photoDataUrl }) => {
        const result = await updateClientContact(deps, {
          id,
          changes: {
            name,
            phone,
            ...(photoDataUrl !== undefined ? { photoDataUrl } : {}),
          },
        });
        if (!result.ok) {
          set({ error: result.error.message });
          return false;
        }
        return reloadDetail(id);
      },
      fileUrl: (storagePath) => fileUrlOn(deps, storagePath),
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
