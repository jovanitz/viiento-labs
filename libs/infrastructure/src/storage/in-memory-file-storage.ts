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
    getSignedUrl: async ({ path }) => {
      const object = objects.get(path);
      if (!object) {
        return err(fileStorageFailed(`No object at ${path}.`));
      }
      // A data URL actually SERVES the object, so dev previews/downloads
      // behave like the real adapter's signed URLs (expiry aside).
      let binary = '';
      for (const byte of object.bytes) binary += String.fromCharCode(byte);
      const base64 =
        typeof btoa === 'function'
          ? btoa(binary)
          : Buffer.from(object.bytes).toString('base64');
      return ok(`data:${object.mime};base64,${base64}`);
    },
    // No HTTP endpoint exists for a browser to PUT to — callers fall back
    // to uploading through the API (`put`).
    createSignedUploadUrl: async () =>
      err(fileStorageFailed('Direct uploads need real object storage.')),
    remove: async (path) => {
      if (!objects.delete(path)) {
        return err(fileStorageFailed(`No object at ${path}.`));
      }
      return ok(undefined);
    },
  };
};
