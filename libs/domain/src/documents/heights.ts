/**
 * The height model — the measuring half of "resolve()" (ADR-0020 §8).
 * Every number here mirrors the preview's CSS (the pt values in ui
 * render/*), so the pages the engine cuts are the pages the screen shows
 * and the PDF draws. Heights round UP (a slot is never shorter than the
 * model says), so an estimation error paginates a row early — visible
 * slack — never clips content off a page.
 */
import { PAPER_PT, RHYTHM } from './model';
import type {
  DocumentBand,
  DocumentModel,
  DocumentRow,
  DocumentSlot,
  DocumentTheme,
} from './model';
import { wrapText } from './measure';
import type { TextMeasure, TextStyle } from './measure';

/** What the chrome math needs — satisfied by both the flowing model and
 *  the paginated tree. */
export type DocumentChrome = Pick<
  DocumentModel,
  'paper' | 'theme' | 'header' | 'footer' | 'marks'
>;

export type LayoutCtx = {
  readonly theme: DocumentTheme;
  readonly measure: TextMeasure;
  /** Body width: paper minus horizontal margins. */
  readonly bodyW: number;
};

export const layoutCtx = (
  model: DocumentChrome,
  measure: TextMeasure,
): LayoutCtx => ({
  theme: model.theme,
  measure,
  bodyW:
    PAPER_PT[model.paper].w -
    model.theme.margins.left -
    model.theme.margins.right,
});

const style = (
  ctx: LayoutCtx,
  sizePt: number,
  weight: TextStyle['weight'] = 400,
): TextStyle => ({ family: ctx.theme.family, sizePt, weight });

export const lineCount = (
  ctx: LayoutCtx,
  text: string,
  sizePt: number,
  maxW: number,
): number => wrapText(text, style(ctx, sizePt), maxW, ctx.measure).length;

/** Label above its value: 0.72×base, single line (CSS nowrap), gap 3. */
const labelH = (ctx: LayoutCtx): number =>
  ctx.theme.labels === 'above' ? ctx.theme.basePt * 0.72 * 1.2 + 3 : 0;

const RULE_EXTRA: Record<DocumentTheme['fieldRule'], number> = {
  underline: 3.5,
  box: 10,
  none: 0,
};

const valueSlotH = (
  ctx: LayoutCtx,
  slot: Extract<DocumentSlot, { kind: 'field' | 'token' }>,
  colW: number,
): number => {
  const { theme } = ctx;
  const inner = colW - (theme.fieldRule === 'box' ? 12 : 0);
  const text =
    theme.labels === 'inline' ? `${slot.label}: ${slot.value}` : slot.value;
  const lines = lineCount(ctx, text, theme.basePt, inner);
  const lineH = theme.basePt * (slot.multiline === true ? 1.55 : 1.3);
  return labelH(ctx) + lines * lineH + RULE_EXTRA[theme.fieldRule];
};

const checklistH = (
  ctx: LayoutCtx,
  slot: Extract<DocumentSlot, { kind: 'checklist' }>,
  colW: number,
): number => {
  const { theme } = ctx;
  const box = theme.basePt * 0.95 + 5;
  const items = slot.items.reduce(
    (h, item) =>
      h +
      lineCount(ctx, item.text, theme.basePt, colW - box) * theme.basePt * 1.45,
    0,
  );
  return labelH(ctx) + 4 + items + Math.max(0, slot.items.length - 1) * 4;
};

/** Reserved height for an embedded image (preview caps at 180pt). */
export const IMAGE_MAX_H = 180;

export const slotHeight = (
  ctx: LayoutCtx,
  slot: DocumentSlot,
  colW: number,
): number => {
  const { theme } = ctx;
  switch (slot.kind) {
    case 'spacer':
      return RHYTHM[theme.density] * { sm: 1, md: 2, lg: 3 }[slot.size];
    case 'static':
      return (
        lineCount(ctx, slot.text, theme.basePt * 0.85, colW) *
        theme.basePt *
        0.85 *
        1.5
      );
    case 'signature':
      return 27 + 9 + theme.basePt * 1.3 + theme.basePt * 0.75 * 1.3;
    case 'checklist':
      return checklistH(ctx, slot, colW);
    case 'file':
      return (
        labelH(ctx) +
        3 +
        (slot.isImage && slot.dataUrl !== undefined
          ? IMAGE_MAX_H
          : theme.basePt * 1.3 + 8)
      );
    default:
      return valueSlotH(ctx, slot, colW);
  }
};

/** Slots share the row evenly; the gap between columns is 1.4×rhythm. */
export const rowColumnWidth = (ctx: LayoutCtx, slots: number): number =>
  (ctx.bodyW - RHYTHM[ctx.theme.density] * 1.4 * Math.max(0, slots - 1)) /
  Math.max(1, slots);

export const rowHeight = (ctx: LayoutCtx, row: DocumentRow): number => {
  const colW = rowColumnWidth(ctx, row.slots.length);
  return Math.max(...row.slots.map((slot) => slotHeight(ctx, slot, colW)), 0);
};

export const sectionTitleHeight = (ctx: LayoutCtx): number => {
  const { theme } = ctx;
  const text = theme.basePt * theme.scale * 0.82 * 1.25;
  if (theme.sectionRule === 'band') return text + 8;
  if (theme.sectionRule === 'line') return text + 4;
  return text;
};

/** Band rows use the band presenters: lead 1.06×, rest 0.82×, gap 4. */
const bandRowsHeight = (ctx: LayoutCtx, band: DocumentBand): number =>
  band.rows.reduce((h, row, i) => {
    const size = ctx.theme.basePt * (i === 0 ? 1.06 : 0.82);
    const first = row.slots[0];
    const text = first !== undefined && 'value' in first ? first.value : '';
    // Band text shares its row with marks; wrap conservatively at 60%.
    const lines = lineCount(ctx, text, size, ctx.bodyW * 0.6);
    return h + lines * size * 1.35 + (i > 0 ? 4 : 0);
  }, 0);

const MARK_H: Record<'logo' | 'qr' | 'seal' | 'signature', number> = {
  logo: 34,
  qr: 46,
  seal: 52,
  signature: 41,
};

const marksHeight = (
  ctx: LayoutCtx,
  model: DocumentChrome,
  region: 'header' | 'footer',
): number =>
  Math.max(
    0,
    ...model.marks
      .filter((m) => m.region === region)
      .map(
        (m) =>
          MARK_H[m.asset] +
          (m.caption !== undefined
            ? lineCount(ctx, m.caption, ctx.theme.basePt * 0.72, 120) *
                ctx.theme.basePt *
                0.72 *
                1.35 +
              5
            : 0),
      ),
  );

export const headerHeight = (
  ctx: LayoutCtx,
  model: DocumentChrome,
  first: boolean,
): number => {
  const { theme } = ctx;
  const rows = model.header ? bandRowsHeight(ctx, model.header) : 0;
  const band = Math.max(rows, marksHeight(ctx, model, 'header'));
  const title = first
    ? theme.basePt * theme.scale * theme.scale * 1.15 * 1.25 +
      RHYTHM[theme.density] * 1.5
    : 0;
  if (band === 0 && title === 0) return 0;
  return band + title;
};

export const footerHeight = (ctx: LayoutCtx, model: DocumentChrome): number => {
  const rows = model.footer ? bandRowsHeight(ctx, model.footer) : 0;
  const band = Math.max(rows, marksHeight(ctx, model, 'footer'));
  // The page-number line is reserved unconditionally: whether pagination
  // produces one page cannot depend on the footer that depends on it.
  return band + ctx.theme.basePt * 0.72 * 1.35;
};
