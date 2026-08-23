import { defineError, type TaggedError } from '@acme/shared';

export const invalidClientId = defineError('domain/invalid-client-id');
export const invalidClientName = defineError('domain/invalid-client-name');
export const invalidClientPhoto = defineError('domain/invalid-client-photo');

export type ClientDomainError =
  | TaggedError<'domain/invalid-client-id'>
  | TaggedError<'domain/invalid-client-name'>
  | TaggedError<'domain/invalid-client-photo'>;
