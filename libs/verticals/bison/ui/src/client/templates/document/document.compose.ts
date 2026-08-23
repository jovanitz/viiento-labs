/**
 * Composition (ADR-0021): every template prints itself. The BODY derives
 * from the capture schema — same order the form captures in, `width:
 * 'half'` pairs two fields on a row, `section` blocks become page
 * sections — and a Format wraps it with letterhead, footer, marks and
 * theme. Nothing is designed per template, so the printed page can never
 * disagree with the form.
 *
 * Pure — no React, no browser. Stand-in for the pure engine's `resolve()`
 * (ADR-0020 §8, which still stands); `deriveSections` becomes part of it.
 */
import { paginateDocument } from '@acme/application';
import type { DocumentModel, TextMeasure } from '@acme/application';
import { STRUCTURAL_KINDS, WIDTH_COLUMNS } from '../templates.types';
import { canvasTextMeasure } from './render/document.measure';
import type {
  EntryTemplate,
  FieldWidth,
  TemplateBlock,
} from '../templates.types';
import { themeById } from './document.themes';
import { decodeFileValue, isImage } from '../values/file-value';
import { TOKEN_LABEL } from './document.tokens';
import type { DocumentToken, TokenValues } from './document.tokens';
import type { DocumentFormat } from './document.format';
import type {
  BandVM,
  DocumentPreviewVM,
  IssueBlockerVM,
  RowVM,
  SectionVM,
  SlotVM,
} from './document.types';

/** Captured values, keyed by block id. */
export type EntryValues = Readonly<Record<string, string>>;

const EMPTY = '—';

const fileSlot = (label: string, value: string): SlotVM => {
  const file = decodeFileValue(value);
  if (!file)
    return { kind: 'file', label, name: value || EMPTY, isImage: false };
  return {
    kind: 'file',
    label,
    name: file.name,
    dataUrl: file.dataUrl,
    isImage: isImage(file),
  };
};

const slotFromBlock = (block: TemplateBlock, value: string): SlotVM => {
  if (block.kind === 'file') return fileSlot(block.label, value);
  if (block.kind === 'signature')
    return { kind: 'signature', label: block.label, name: value || EMPTY };
  if (block.kind === 'checkboxes')
    return {
      kind: 'checklist',
      label: block.label,
      items: (block.options ?? []).map((text) => ({
        text,
        checked: value.includes(text),
      })),
    };
  return {
    kind: 'field',
    label: block.label,
    value: value || EMPTY,
    multiline: block.kind === 'long-text',
  };
};

type SectionDraft = {
  readonly id: string;
  readonly title?: string | undefined;
  readonly rows: SlotVM[][];
  open: FieldWidth | undefined;
};

const draft = (id: string, title?: string): SectionDraft => ({
  id,
  title,
  rows: [],
  open: undefined,
});

/** Same-width neighbours pack up to their capacity (half → 2, third → 3);
 *  anything else starts its own row — the same rule the fill form uses
 *  (timeline.fill.logic.ts), so paper mirrors capture. */
const place = (
  section: SectionDraft,
  slot: SlotVM,
  width: FieldWidth,
): void => {
  const last = section.rows[section.rows.length - 1];
  if (
    width !== 'full' &&
    width === section.open &&
    last &&
    last.length < WIDTH_COLUMNS[width]
  ) {
    last.push(slot);
    section.open = last.length < WIDTH_COLUMNS[width] ? width : undefined;
    return;
  }
  section.rows.push([slot]);
  section.open = width === 'full' ? undefined : width;
};

/** The body, straight from the capture schema. */
export const deriveSections = (
  template: EntryTemplate,
  values: EntryValues,
): readonly SectionVM[] => {
  const drafts: SectionDraft[] = [draft('body')];
  for (const block of template.blocks) {
    if (block.kind === 'help-text') continue;
    if (block.kind === 'section') {
      drafts.push(draft(block.id, block.label));
      continue;
    }
    const current = drafts[drafts.length - 1];
    if (current)
      place(current, slotFromBlock(block, values[block.id] ?? ''), block.width);
  }
  return drafts
    .filter((d) => d.rows.length > 0)
    .map((d) => ({
      id: d.id,
      ...(d.title !== undefined ? { title: d.title } : {}),
      rows: d.rows.map((slots) => ({ slots })),
    }));
};

/** Letterhead/footer lines — one token per row. A token the account has
 *  not filled in prints nothing (owner's call): the app never invents an
 *  identity to fill the gap. */
const bandFromTokens = (
  wanted: readonly DocumentToken[],
  tokens: TokenValues,
): BandVM | undefined => {
  const rows: RowVM[] = wanted.flatMap((token) => {
    const value = tokens[token];
    return value
      ? [
          {
            slots: [
              { kind: 'token' as const, label: TOKEN_LABEL[token], value },
            ],
          },
        ]
      : [];
  });
  return rows.length > 0 ? { rows } : undefined;
};

/** The only issue-time blocker left under ADR-0021: a required field with
 *  no value on this entry. Unbound/unknown fields cannot exist — the body
 *  IS the schema. */
export const blockersFor = (
  template: EntryTemplate,
  values: EntryValues,
): readonly IssueBlockerVM[] =>
  template.blocks
    .filter((b) => (b.required ?? false) && !STRUCTURAL_KINDS.includes(b.kind))
    .filter((b) => (values[b.id] ?? '').trim() === '')
    .map((b) => ({
      id: `blank-${b.id}`,
      message: `“${b.label}” has no value on this entry.`,
    }));

/** The flowing document, before pagination — schema-derived body wrapped
 *  by the format (ADR-0021). */
export const composeModel = ({
  format,
  template,
  values,
  tokens,
}: {
  readonly format: DocumentFormat;
  readonly template: EntryTemplate;
  readonly values: EntryValues;
  readonly tokens: TokenValues;
}): DocumentModel => {
  const header = bandFromTokens(format.headerTokens, tokens);
  const footer = bandFromTokens(format.footerTokens, tokens);
  return {
    title: template.name,
    paper: format.paper,
    theme: themeById(format.themeId),
    ...(header ? { header } : {}),
    ...(footer ? { footer } : {}),
    marks: format.marks,
    sections: deriveSections(template, values),
  };
};

export const documentPreview = ({
  format,
  template,
  values,
  tokens,
  sample,
  measure = canvasTextMeasure,
}: {
  readonly format: DocumentFormat;
  readonly template: EntryTemplate;
  readonly values: EntryValues;
  readonly tokens: TokenValues;
  readonly sample?: DocumentPreviewVM['sample'] | undefined;
  readonly measure?: TextMeasure;
}): DocumentPreviewVM => ({
  document: paginateDocument(
    composeModel({ format, template, values, tokens }),
    measure,
  ),
  blockers: blockersFor(template, values),
  ...(sample ? { sample } : {}),
});
