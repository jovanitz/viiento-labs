import { createStore } from 'zustand/vanilla';
import type {
  BisonClientFlowDeps,
  DocumentFormatDto,
  SaveFormatInput,
} from '@acme/bison-application';
import { loadFormats, saveFormat } from '@acme/bison-application';

/**
 * The thin, reactive store for document formats (ADR-0021) — used by the
 * Templates section's Formats tab AND the client detail's document view.
 * Backend rows only; merging over the shipped catalog is presentation
 * (templates/wired/formats.bridge.ts).
 */
export type FormatsStoreState = {
  readonly formats: ReadonlyArray<DocumentFormatDto> | null;
  readonly error: string | null;
  readonly load: () => Promise<void>;
  readonly save: (input: SaveFormatInput) => Promise<boolean>;
};

export type FormatsStore = ReturnType<typeof createFormatsStore>;

export const createFormatsStore = (deps: BisonClientFlowDeps) =>
  createStore<FormatsStoreState>((set) => {
    const reload = async () => {
      const result = await loadFormats(deps);
      set(
        result.ok
          ? { error: null, formats: result.value }
          : { error: result.error.message },
      );
    };
    return {
      formats: null,
      error: null,
      load: reload,
      save: async (input) => {
        const result = await saveFormat(deps, input);
        if (!result.ok) {
          set({ error: result.error.message });
          return false;
        }
        await reload();
        return true;
      },
    };
  });
