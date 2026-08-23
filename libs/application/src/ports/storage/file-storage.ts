import { defineError, type Result, type TaggedError } from '@acme/shared';

/**
 * Outbound port for binary content — images, documents, signatures. The
 * application deals in paths and bytes; WHERE the bytes live (Supabase
 * Storage, a local cache, an in-memory map in tests) is an adapter concern.
 *
 * Reads resolve a path to a short-lived signed URL rather than streaming
 * bytes through the application: presenters hand the URL to the platform
 * (an <img>, a share sheet), which is the piece that actually moves data.
 *
 * Storage failures are *expected* (offline, quota, revoked access), so the
 * port returns `Result` — never throws.
 */
export const fileStorageFailed = defineError('app/file-storage-failed');

export type FileStorageError = TaggedError<'app/file-storage-failed'>;

export type FileStorage = {
  readonly put: (input: {
    /** Relative to the account's storage root — adapters own the prefix. */
    readonly path: string;
    readonly bytes: Uint8Array;
    readonly mime: string;
  }) => Promise<Result<void, FileStorageError>>;
  readonly getSignedUrl: (input: {
    readonly path: string;
    readonly expiresInSeconds: number;
  }) => Promise<Result<string, FileStorageError>>;
  /**
   * A one-shot URL the CLIENT can PUT the raw bytes to, so uploads go
   * straight to the bucket instead of riding through the API as base64.
   * Adapters without a reachable upload endpoint (in-memory dev) return an
   * error — callers fall back to `put` through the API.
   */
  readonly createSignedUploadUrl: (input: {
    readonly path: string;
  }) => Promise<Result<string, FileStorageError>>;
  readonly remove: (path: string) => Promise<Result<void, FileStorageError>>;
};
