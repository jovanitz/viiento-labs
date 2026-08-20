import { defineError, type TaggedError } from '@acme/shared';
import type { ClientDomainError } from '@acme/bison-domain';

export const clientNotFound = defineError('app/client-not-found');

export type ClientUseCaseError =
  | ClientDomainError
  | TaggedError<'app/client-not-found'>;
