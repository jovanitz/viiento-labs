import { type Result, err, ok } from '@acme/shared';
import {
  type FileStorage,
  type FileStorageError,
  fileStorageFailed,
} from '@acme/application';

/**
 * Supabase Storage `FileStorage` adapter. Raw fetch on purpose — the three
 * endpoints we need (upload, sign, delete) don't justify supabase-js (same
 * call as supabase-auth-api.ts).
 *
 * Server-only: it authenticates with the SECRET (service) key, which
 * bypasses storage RLS — the application layer has already authorized the
 * caller by the time an adapter runs. Exported via `@acme/infrastructure`'s
 * node entry, never the browser barrel.
 */
export type SupabaseFileStorageConfig = {
  readonly supabaseUrl: string;
  /** Supabase SECRET (service) key. Never ships to a client bundle. */
  readonly serviceKey: string;
  readonly bucket: string;
  readonly fetchFn?: typeof fetch;
};

export const createSupabaseFileStorage = (
  config: SupabaseFileStorageConfig,
): FileStorage => {
  const fetchFn = config.fetchFn ?? fetch;
  const base = `${config.supabaseUrl.replace(/\/$/, '')}/storage/v1`;
  const auth = { Authorization: `Bearer ${config.serviceKey}` };

  const call = async (
    operation: string,
    request: () => Promise<Response>,
  ): Promise<Result<Response, FileStorageError>> => {
    try {
      const response = await request();
      if (!response.ok) {
        return err(
          fileStorageFailed(
            `Storage ${operation} failed with status ${response.status}.`,
          ),
        );
      }
      return ok(response);
    } catch (cause) {
      return err(
        fileStorageFailed(
          `Storage ${operation} failed: ${cause instanceof Error ? cause.message : 'network error'}.`,
        ),
      );
    }
  };

  return {
    put: async ({ path, bytes, mime }) => {
      const response = await call('put', () =>
        fetchFn(`${base}/object/${config.bucket}/${path}`, {
          method: 'POST',
          headers: { ...auth, 'Content-Type': mime },
          // The port speaks Uint8Array; a plain ArrayBuffer copy satisfies
          // both the DOM and the undici fetch typings.
          body: bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ) as ArrayBuffer,
        }),
      );
      return response.ok ? ok(undefined) : err(response.error);
    },

    getSignedUrl: async ({ path, expiresInSeconds }) => {
      const response = await call('sign', () =>
        fetchFn(`${base}/object/sign/${config.bucket}/${path}`, {
          method: 'POST',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresIn: expiresInSeconds }),
        }),
      );
      if (!response.ok) return err(response.error);
      const payload = (await response.value.json()) as {
        readonly signedURL?: string;
      };
      if (!payload.signedURL) {
        return err(fileStorageFailed('Storage sign returned no URL.'));
      }
      return ok(`${base}${payload.signedURL}`);
    },

    remove: async (path) => {
      const response = await call('remove', () =>
        fetchFn(`${base}/object/${config.bucket}/${path}`, {
          method: 'DELETE',
          headers: auth,
        }),
      );
      return response.ok ? ok(undefined) : err(response.error);
    },
  };
};
