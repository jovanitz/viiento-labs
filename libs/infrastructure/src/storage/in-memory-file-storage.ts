import { err, ok } from '@acme/shared';
import { type FileStorage, fileStorageFailed } from '@acme/application';

/**
 * In-memory `FileStorage` — the reference adapter for use-case specs and
 * offline/dev composition. Mirrors the real adapter's semantics: signing or
 * removing a path that holds no object is a failure, not a silent success.
 */
export type InMemoryFileStorage = FileStorage & {
  /** Test/debug window into what was stored. */
  readonly objects: ReadonlyMap<
    string,
    { readonly bytes: Uint8Array; readonly mime: string }
  >;
};

export const createInMemoryFileStorage = (): InMemoryFileStorage => {
  const objects = new Map<string, { bytes: Uint8Array; mime: string }>();
  return {
    objects,
    put: async ({ path, bytes, mime }) => {
      objects.set(path, { bytes, mime });
      return ok(undefined);
    },
    getSignedUrl: async ({ path, expiresInSeconds }) => {
      if (!objects.has(path)) {
        return err(fileStorageFailed(`No object at ${path}.`));
      }
      return ok(`memory://${path}?expires=${expiresInSeconds}`);
    },
    remove: async (path) => {
      if (!objects.delete(path)) {
        return err(fileStorageFailed(`No object at ${path}.`));
      }
      return ok(undefined);
    },
  };
};
