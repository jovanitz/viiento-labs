import { defineError, type TaggedError } from '@acme/shared';

/**
 * Business-rule violations for the Template aggregate — pure data, returned
 * (never thrown) so callers handle them exhaustively. Infrastructure failures
 * are not represented here.
 */
export const invalidTemplateId = defineError('domain/invalid-template-id');
export const invalidTemplateName = defineError('domain/invalid-template-name');
export const invalidTemplateBlocks = defineError(
  'domain/invalid-template-blocks',
);
export const templateNotEditable = defineError('domain/template-not-editable');

export type TemplateDomainError =
  | TaggedError<'domain/invalid-template-id'>
  | TaggedError<'domain/invalid-template-name'>
  | TaggedError<'domain/invalid-template-blocks'>
  | TaggedError<'domain/template-not-editable'>;
