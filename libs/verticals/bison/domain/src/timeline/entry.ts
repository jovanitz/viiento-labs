import { type Brand, type Result, err, ok } from '@acme/shared';
import type { ClientId } from '../clients/client';
import { SINGLE_CHOICE_KINDS, isStructural } from '../templates/blocks';
import type { TemplateBlock } from '../templates/blocks';
import type {
  Template,
  TemplateColor,
  TemplateIcon,
  TemplateId,
} from '../templates/template';
import { invalidEntryId, invalidEntryValues } from './errors';
import type { EntryDomainError } from './errors';
import { fileDisplayName } from './file-ref';

/**
 * A Timeline entry — one filled template attached to a client's running
 * record. The entry is deliberately SELF-CONTAINED: it stores a
 * denormalized copy of each captured field (`blockId` + label + value) and
 * of the template's identity (name/icon/color), never a live reference to
 * the schema. Editing the template tomorrow must not reinterpret what was
 * captured yesterday.
 */

export type EntryId = Brand<string, 'EntryId'>;

export const makeEntryId = (raw: string): Result<EntryId, EntryDomainError> => {
  const value = raw.trim();
  if (value.length === 0) {
    return err(invalidEntryId('Entry id must not be empty.'));
  }
  return ok(value as EntryId);
};

/** What the fill-in form hands over: raw value per capturing block id. */
export type FillValues = Readonly<Record<string, string>>;

/** One captured value — the label rides along so the entry stays readable
 *  even if the source block is later renamed or removed. */
export type EntryField = {
  readonly blockId: string;
  readonly label: string;
  readonly value: string;
};

export type Entry = {
  readonly id: EntryId;
  readonly clientId: ClientId;
  readonly templateId: TemplateId;
  /** Denormalized template identity — see the module note. */
  readonly templateName: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  /** ISO instant the entry belongs to on the timeline. */
  readonly at: string;
  /** One-line excerpt for cards; the full picture is `fields`. */
  readonly summary: string;
  /** Capture order, structural blocks and empty optionals skipped. */
  readonly fields: readonly EntryField[];
};

const SUMMARY_MAX = 80;

const capturing = (blocks: readonly TemplateBlock[]): TemplateBlock[] =>
  blocks.filter((block) => !isStructural(block.kind));

const fillProblems = (
  blocks: readonly TemplateBlock[],
  values: FillValues,
): {
  readonly unknown: readonly string[];
  readonly missing: readonly string[];
  readonly invalidChoice: readonly string[];
} => {
  const capturable = new Set(capturing(blocks).map((block) => block.id));
  const unknown = Object.keys(values).filter((id) => !capturable.has(id));

  const missing = capturing(blocks)
    .filter((block) => block.required)
    .filter((block) => (values[block.id] ?? '').trim().length === 0)
    .map((block) => block.id);

  const invalidChoice = capturing(blocks)
    .filter((block) => SINGLE_CHOICE_KINDS.includes(block.kind))
    .filter((block) => {
      const value = (values[block.id] ?? '').trim();
      return value.length > 0 && !(block.options ?? []).includes(value);
    })
    .map((block) => block.id);

  return { unknown, missing, invalidChoice };
};

const deriveFields = (
  blocks: readonly TemplateBlock[],
  values: FillValues,
): readonly EntryField[] =>
  capturing(blocks).flatMap((block) => {
    const value = (values[block.id] ?? '').trim();
    if (value.length === 0) return [];
    return [{ blockId: block.id, label: block.label, value }];
  });

/** The card excerpt: the first captured value, file refs by their name. */
export const deriveSummary = (fields: readonly EntryField[]): string => {
  const first = fields[0];
  if (!first) return '';
  const display = fileDisplayName(first.value);
  return display.length > SUMMARY_MAX
    ? `${display.slice(0, SUMMARY_MAX - 1)}…`
    : display;
};

/**
 * Fill a template into an entry. Validates the whole fill at once —
 * unknown target blocks, missing required values, single-choice values
 * outside the options — and reports every offender in one error's
 * `details`.
 */
export const fillEntry = (
  template: Template,
  input: {
    readonly id: EntryId;
    readonly clientId: ClientId;
    readonly values: FillValues;
    readonly occurredAt: string;
  },
): Result<Entry, EntryDomainError> => {
  const problems = fillProblems(template.blocks, input.values);
  if (
    problems.unknown.length > 0 ||
    problems.missing.length > 0 ||
    problems.invalidChoice.length > 0
  ) {
    return err(
      invalidEntryValues(
        `The filled values don't satisfy template ${template.id}.`,
        { details: problems },
      ),
    );
  }

  const fields = deriveFields(template.blocks, input.values);
  return ok({
    id: input.id,
    clientId: input.clientId,
    templateId: template.id,
    templateName: template.name,
    icon: template.icon,
    color: template.color,
    at: input.occurredAt,
    summary: deriveSummary(fields),
    fields,
  });
};
