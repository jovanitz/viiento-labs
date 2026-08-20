import { defineError, type TaggedError } from '@acme/shared';
import type { FileStorageError } from '@acme/application';
import type { ClientDomainError } from '@acme/bison-domain';

/** A storagePath that doesn't match `clients/<clientId>/<fileId>` — either a
 *  malformed request or a probe; never signed. */
export const filePathInvalid = defineError('app/file-path-invalid');

export type FileUseCaseError =
  | FileStorageError
  | ClientDomainError
  | TaggedError<'app/file-path-invalid'>
  | TaggedError<'app/client-not-found'>;
