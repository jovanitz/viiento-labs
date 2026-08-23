import { defineError, type TaggedError } from '@acme/shared';

export const invalidFormatId = defineError('domain/invalid-format-id');
/** One error for the whole format — `details.problems` lists every
 *  violation, so the editor can mark all of them in a single pass. */
export const invalidFormat = defineError('domain/invalid-format');

export type FormatDomainError =
  | TaggedError<'domain/invalid-format-id'>
  | TaggedError<'domain/invalid-format'>;
