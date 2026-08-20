import type { FileStorage } from '@acme/application';

/**
 * Scope a `FileStorage` under a fixed prefix — how the composition root
 * turns one bucket-wide adapter into per-account storage
 * (`withPathPrefix(base, 'accounts/<id>')`). The application keeps speaking
 * account-relative paths (the port's contract); the prefix never leaks into
 * stored `FileRef` values.
 */
export const withPathPrefix = (
  storage: FileStorage,
  prefix: string,
): FileStorage => {
  const scoped = (path: string): string => `${prefix}/${path}`;
  return {
    put: ({ path, bytes, mime }) =>
      storage.put({ path: scoped(path), bytes, mime }),
    getSignedUrl: ({ path, expiresInSeconds }) =>
      storage.getSignedUrl({ path: scoped(path), expiresInSeconds }),
    remove: (path) => storage.remove(scoped(path)),
  };
};
