import { type Result, err, ok } from '@acme/shared';
import { invalidTemplateBlocks } from './errors';
import type { TemplateDomainError } from './errors';

/**
 * The capture schema's building block. Data-capturing kinds
 * (short-text … signature) become a field on a filled entry; structural
 * kinds (section, help-text) only organize the form and never produce a
 * value. Capture order is also print order (ADR-0021) — there is no second
 * layout structure to drift.
 */
export type FieldKind =
  | 'short-text'
  | 'long-text'
  | 'number'
  | 'radio'
  | 'select'
  | 'checkboxes'
  | 'switch'
  | 'date'
  | 'time'
  | 'file'
  | 'signature'
  | 'section'
  | 'help-text';

/** Every kind, as data — the single source for zod schemas and UI palettes. */
export const FIELD_KINDS: readonly FieldKind[] = [
  'short-text',
  'long-text',
  'number',
  'radio',
  'select',
  'checkboxes',
  'switch',
  'date',
  'time',
  'file',
  'signature',
  'section',
  'help-text',
];

export const FIELD_WIDTHS: readonly FieldWidth[] = ['full', 'half', 'third'];

export const STRUCTURAL_KINDS: readonly FieldKind[] = ['section', 'help-text'];

export const CHOICE_KINDS: readonly FieldKind[] = [
  'radio',
  'select',
  'checkboxes',
];

/** Choice kinds whose captured value must be exactly one of the options
 *  (checkboxes capture a combination, so membership isn't one-of). */
export const SINGLE_CHOICE_KINDS: readonly FieldKind[] = ['radio', 'select'];

export const isStructural = (kind: FieldKind): boolean =>
  STRUCTURAL_KINDS.includes(kind);

export const isChoice = (kind: FieldKind): boolean =>
  CHOICE_KINDS.includes(kind);

/** How many fields share a row — carried into the printed body (ADR-0021). */
export type FieldWidth = 'full' | 'half' | 'third';

export type TemplateBlock = {
  readonly id: string;
  readonly kind: FieldKind;
  /** The field's label — or, for `section`/`help-text`, the heading/body
   *  text itself. */
  readonly label: string;
  readonly required?: boolean;
  readonly width: FieldWidth;
  /** Choices for radio/select/checkboxes. */
  readonly options?: readonly string[];
};

const identityProblems = (
  block: TemplateBlock,
  seen: ReadonlySet<string>,
  at: string,
): readonly string[] => {
  const problems: string[] = [];
  if (block.id.trim().length === 0) {
    problems.push(`${at}: id must not be empty`);
  } else if (seen.has(block.id)) {
    problems.push(`${at}: duplicate id`);
  }
  if (block.label.trim().length === 0) {
    problems.push(`${at}: label must not be empty`);
  }
  return problems;
};

const kindProblems = (block: TemplateBlock, at: string): readonly string[] => {
  const problems: string[] = [];
  if (isChoice(block.kind)) {
    const options = (block.options ?? []).filter(
      (option) => option.trim().length > 0,
    );
    if (options.length === 0) {
      problems.push(`${at}: ${block.kind} needs at least one option`);
    }
  } else if (block.options !== undefined) {
    problems.push(`${at}: ${block.kind} must not carry options`);
  }
  if (isStructural(block.kind) && block.required) {
    problems.push(`${at}: structural ${block.kind} cannot be required`);
  }
  return problems;
};

/**
 * Schema-wide invariants. Collected into one error whose `details.problems`
 * lists every violation, so a form builder can surface all of them at once.
 */
export const validateBlocks = (
  blocks: readonly TemplateBlock[],
): Result<void, TemplateDomainError> => {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    const at = `block "${block.id || '(missing id)'}"`;
    problems.push(...identityProblems(block, seen, at));
    problems.push(...kindProblems(block, at));
    seen.add(block.id);
  }

  if (!blocks.some((block) => !isStructural(block.kind))) {
    problems.push('a template needs at least one data-capturing block');
  }

  if (problems.length > 0) {
    return err(
      invalidTemplateBlocks('The template schema is invalid.', {
        details: { problems },
      }),
    );
  }
  return ok(undefined);
};
