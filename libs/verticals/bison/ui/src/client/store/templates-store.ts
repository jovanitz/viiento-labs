import { createStore } from 'zustand/vanilla';
import type {
  BisonClientFlowDeps,
  SaveTemplateInput,
  TemplatesVM,
} from '@acme/bison-application';
import { loadTemplates, saveTemplate } from '@acme/bison-application';

/**
 * The thin, reactive store for the Templates section — same discipline as
 * clients-store: every action delegates to a headless controller, stores
 * the result, and reloads.
 */
export type TemplatesStoreState = {
  readonly vm: TemplatesVM | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly load: () => Promise<void>;
  readonly save: (input: SaveTemplateInput) => Promise<boolean>;
};

export type TemplatesStore = ReturnType<typeof createTemplatesStore>;

export const createTemplatesStore = (deps: BisonClientFlowDeps) =>
  createStore<TemplatesStoreState>((set) => {
    const reload = async () => {
      const result = await loadTemplates(deps);
      set(
        result.ok
          ? { loading: false, error: null, vm: result.value }
          : { loading: false, error: result.error.message },
      );
    };
    return {
      vm: null,
      loading: false,
      error: null,
      load: async () => {
        set({ loading: true });
        await reload();
      },
      save: async (input) => {
        const result = await saveTemplate(deps, input);
        if (!result.ok) {
          set({ error: result.error.message });
          return false;
        }
        await reload();
        return true;
      },
    };
  });
