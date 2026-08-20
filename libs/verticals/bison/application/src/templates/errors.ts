import { defineError, type TaggedError } from '@acme/shared';
import type { TemplateDomainError } from '@acme/bison-domain';

export const templateNotFound = defineError('app/template-not-found');

export type TemplateUseCaseError =
  | TemplateDomainError
  | TaggedError<'app/template-not-found'>;
