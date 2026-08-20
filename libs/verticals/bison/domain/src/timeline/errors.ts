import { defineError, type TaggedError } from '@acme/shared';

export const invalidEntryId = defineError('domain/invalid-entry-id');
/** One error for the whole fill — `details` carries every offender, so an
 *  inline form can mark all of them in a single pass. */
export const invalidEntryValues = defineError('domain/invalid-entry-values');

export type EntryDomainError =
  | TaggedError<'domain/invalid-entry-id'>
  | TaggedError<'domain/invalid-entry-values'>;
