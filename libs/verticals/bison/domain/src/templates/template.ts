import { type Brand, type Result, err, ok } from '@acme/shared';
import {
  invalidTemplateId,
  invalidTemplateName,
  templateNotEditable,
} from './errors';
import type { TemplateDomainError } from './errors';
import { validateBlocks } from './blocks';
import type { TemplateBlock } from './blocks';

/**
 * The Template aggregate — account-level, reusable across every client. A
 * Template is an identity (name/description/icon/color) plus an ordered
 * schema of Blocks (see blocks.ts): the flexible-form definition a Timeline
 * entry is filled against.
 *
 * This is the persistence-shape twin of the UI's `EntryTemplate`
 * (libs/verticals/bison/ui/.../templates.types.ts): the closed icon/color
 * unions are identity keys the UI resolves to glyphs/classes; the domain
 * never touches a rendering concern.
 */

export type TemplateId = Brand<string, 'TemplateId'>;

export const makeTemplateId = (
  raw: string,
): Result<TemplateId, TemplateDomainError> => {
  const value = raw.trim();
  if (value.length === 0) {
    return err(invalidTemplateId('Template id must not be empty.'));
  }
  return ok(value as TemplateId);
};

/** Default templates ship with the account and are not editable; custom ones
 *  the business builds itself. */
export type TemplateKind = 'default' | 'custom';

/** Icon key, resolved to a glyph by the UI — a closed union, never a free
 *  string, so every consumer can enumerate it. */
export type TemplateIcon =
  | 'file-text'
  | 'stethoscope'
  | 'shield-check'
  | 'sparkles';

/** Recognition accent — the hue follows the template everywhere its icon
 *  does. Closed palette; the business picks, it never types a color. */
export type TemplateColor =
  | 'gray'
  | 'teal'
  | 'blue'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'green';

/** The closed unions as data — the single source for zod schemas and UI
 *  pickers. */
export const TEMPLATE_ICONS: readonly TemplateIcon[] = [
  'file-text',
  'stethoscope',
  'shield-check',
  'sparkles',
];

export const TEMPLATE_COLORS: readonly TemplateColor[] = [
  'gray',
  'teal',
  'blue',
  'violet',
  'amber',
  'rose',
  'green',
];

export type Template = {
  readonly id: TemplateId;
  readonly name: string;
  readonly description: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  readonly kind: TemplateKind;
  /** The capture schema, in capture order — which is also print order. */
  readonly blocks: readonly TemplateBlock[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

const TEMPLATE_NAME_MAX = 80;

const makeName = (raw: string): Result<string, TemplateDomainError> => {
  const value = raw.trim();
  if (value.length === 0) {
    return err(invalidTemplateName('Template name must not be empty.'));
  }
  if (value.length > TEMPLATE_NAME_MAX) {
    return err(
      invalidTemplateName(
        `Template name must be at most ${TEMPLATE_NAME_MAX} characters.`,
        { details: { length: value.length, max: TEMPLATE_NAME_MAX } },
      ),
    );
  }
  return ok(value);
};

/**
 * Creating always yields a `custom` template — `default` ones are seeded
 * product artifacts, never born through this function.
 */
export const createTemplate = (input: {
  readonly id: TemplateId;
  readonly name: string;
  readonly description: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  readonly blocks: readonly TemplateBlock[];
  readonly occurredAt: string;
}): Result<Template, TemplateDomainError> => {
  const name = makeName(input.name);
  if (!name.ok) return err(name.error);
  const blocks = validateBlocks(input.blocks);
  if (!blocks.ok) return err(blocks.error);

  return ok({
    id: input.id,
    name: name.value,
    description: input.description.trim(),
    icon: input.icon,
    color: input.color,
    kind: 'custom',
    blocks: input.blocks,
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });
};

export type TemplateChanges = {
  readonly name?: string;
  readonly description?: string;
  readonly icon?: TemplateIcon;
  readonly color?: TemplateColor;
  readonly blocks?: readonly TemplateBlock[];
};

/** Only `custom` templates are editable — the shipped defaults are fixed. */
export const updateTemplate = (
  template: Template,
  changes: TemplateChanges,
  occurredAt: string,
): Result<Template, TemplateDomainError> => {
  if (template.kind !== 'custom') {
    return err(
      templateNotEditable(`Template ${template.id} is a default template.`),
    );
  }
  const name = makeName(changes.name ?? template.name);
  if (!name.ok) return err(name.error);
  const nextBlocks = changes.blocks ?? template.blocks;
  const blocks = validateBlocks(nextBlocks);
  if (!blocks.ok) return err(blocks.error);

  return ok({
    ...template,
    name: name.value,
    description: (changes.description ?? template.description).trim(),
    icon: changes.icon ?? template.icon,
    color: changes.color ?? template.color,
    blocks: nextBlocks,
    updatedAt: occurredAt,
  });
};
