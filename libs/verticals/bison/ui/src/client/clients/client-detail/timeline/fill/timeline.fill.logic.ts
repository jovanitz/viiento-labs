/** Pure helpers for filling in a Template's blocks — turning the capture
 *  schema into starting values, validity, the EntryField list a
 *  TimelineEntry stores, and back again (editing an existing entry seeds
 *  its form from what's already there). Data only, no framework. */
import {
  STRUCTURAL_KINDS,
  WIDTH_COLUMNS,
} from '../../../../templates/templates.types';
import type {
  FieldWidth,
  TemplateBlock,
} from '../../../../templates/templates.types';
import { fileDisplayName } from '../../../../templates/values/file-value';
import type { EntryField } from '../timeline.types';

export type FillValues = Readonly<Record<string, string>>;

const dataBlocks = (blocks: readonly TemplateBlock[]) =>
  blocks.filter((b) => !STRUCTURAL_KINDS.includes(b.kind));

export const emptyFillValues = (blocks: readonly TemplateBlock[]): FillValues =>
  Object.fromEntries(dataBlocks(blocks).map((b) => [b.id, '']));

/** Reconstructs editable values from an already-filled entry — matches
 *  fields to blocks by position (both are derived from `dataBlocks` in the
 *  same order), since EntryField only stores label/value, not a block id. */
export const valuesFromFields = (
  blocks: readonly TemplateBlock[],
  fields: readonly EntryField[],
): FillValues =>
  Object.fromEntries(
    dataBlocks(blocks).map((b, i) => {
      const raw = fields[i]?.value ?? '';
      return [b.id, raw === '—' ? '' : raw];
    }),
  );

export const isFillValid = (
  blocks: readonly TemplateBlock[],
  values: FillValues,
): boolean =>
  dataBlocks(blocks).every(
    (b) => !b.required || (values[b.id] ?? '').trim() !== '',
  );

export const fieldsFrom = (
  blocks: readonly TemplateBlock[],
  values: FillValues,
): readonly EntryField[] =>
  dataBlocks(blocks).map((b) => ({
    label: b.label,
    value: (values[b.id] ?? '').trim() || '—',
  }));

export const summaryFrom = (
  blocks: readonly TemplateBlock[],
  values: FillValues,
): string => {
  const first = dataBlocks(blocks).find((b) => (values[b.id] ?? '').trim());
  // A file value summarises as its NAME — the encoding never leaks out.
  return first ? fileDisplayName(values[first.id]!.trim()) : 'No details yet.';
};

/**
 * Groups blocks into visual rows for a fill form: consecutive `half`
 * blocks share a row (two at most), everything else stands alone — the
 * SAME rule the printed page uses (document.compose.ts), so what sits
 * beside "Age" while filling is what sits beside it on paper.
 */
export const fillRows = (
  blocks: readonly TemplateBlock[],
): readonly (readonly TemplateBlock[])[] => {
  const rows: TemplateBlock[][] = [];
  let open: FieldWidth | undefined;
  for (const block of blocks) {
    const width = STRUCTURAL_KINDS.includes(block.kind) ? 'full' : block.width;
    const last = rows[rows.length - 1];
    if (
      width !== 'full' &&
      width === open &&
      last &&
      last.length < WIDTH_COLUMNS[width]
    ) {
      last.push(block);
      open = last.length < WIDTH_COLUMNS[width] ? width : undefined;
      continue;
    }
    rows.push([block]);
    open = width === 'full' ? undefined : width;
  }
  return rows;
};
