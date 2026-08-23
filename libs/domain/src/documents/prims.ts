/**
 * Page assembly: PaginatedDocument → positioned primitives, one array per
 * page, using the SAME height model that decided the page cuts. The PDF
 * adapter paints these and decides nothing.
 *
 * Marks (logo, QR, seal, signature squiggle) are NOT emitted: their
 * on-screen glyphs are placeholders, and printing a fake QR onto a real
 * artifact would lie. The band reserves their space (heights.ts), so the
 * corner stays blank until the account has real assets — same stance as
 * empty letterhead tokens.
 */
import {
  DOC_INK,
  DOC_INK_MUTED,
  PAPER_PT,
  RHYTHM,
  type DocumentBand,
  type DocumentSection,
  type PaginatedDocument,
} from './model';
import type { TextMeasure } from './measure';
import {
  footerHeight,
  headerHeight,
  layoutCtx,
  rowColumnWidth,
  rowHeight,
  sectionTitleHeight,
} from './heights';
import type { LayoutCtx } from './heights';
import { slotPrims } from './prims.slots';
import { textLines } from './prims.types';
import type { DocPrim } from './prims.types';

type Walk = {
  readonly ctx: LayoutCtx;
  readonly doc: PaginatedDocument;
  readonly out: DocPrim[];
  readonly x0: number;
};

const emitBandRows = (walk: Walk, band: DocumentBand, y: number): number => {
  const { theme } = walk.ctx;
  let dy = 0;
  band.rows.forEach((row, i) => {
    const first = row.slots[0];
    const text = first !== undefined && 'value' in first ? first.value : '';
    const size = theme.basePt * (i === 0 ? 1.06 : 0.82);
    dy += textLines(
      {
        ctx: walk.ctx,
        x: walk.x0,
        y: y + dy,
        w: walk.ctx.bodyW * 0.6,
        emit: (p) => walk.out.push(p),
      },
      text,
      {
        sizePt: size,
        weight: i === 0 ? 700 : 400,
        color: i === 0 ? DOC_INK : DOC_INK_MUTED,
      },
      y + dy,
    );
    dy += i < band.rows.length - 1 ? 4 : 0;
  });
  return dy;
};

const emitTitle = (walk: Walk, y: number): void => {
  const { theme } = walk.ctx;
  const size = theme.basePt * theme.scale * theme.scale * 1.15;
  walk.out.push({
    kind: 'text',
    x: walk.x0,
    y: y + RHYTHM[theme.density] * 0.5,
    text: walk.doc.title,
    sizePt: size,
    weight: 700,
    color: DOC_INK,
    lineH: size * 1.25,
  });
};

const emitSectionTitle = (
  walk: Walk,
  section: DocumentSection,
  y: number,
): void => {
  const { theme } = walk.ctx;
  const size = theme.basePt * theme.scale * 0.82;
  const titleColor = theme.sectionRule === 'band' ? theme.accent : DOC_INK;
  if (theme.sectionRule === 'band') {
    walk.out.push({
      kind: 'rect',
      x: walk.x0,
      y,
      w: walk.ctx.bodyW,
      h: sectionTitleHeight(walk.ctx),
      fill: `${theme.accent}1a`,
    });
  }
  walk.out.push({
    kind: 'text',
    x: walk.x0 + (theme.sectionRule === 'band' ? 7 : 0),
    y: y + (theme.sectionRule === 'band' ? 4 : 0),
    text: (section.title ?? '').toUpperCase(),
    sizePt: size,
    weight: 700,
    color: theme.sectionRule === 'none' ? DOC_INK_MUTED : titleColor,
    lineH: size * 1.25,
  });
  if (theme.sectionRule === 'line') {
    const yy = y + sectionTitleHeight(walk.ctx) - 1;
    walk.out.push({
      kind: 'line',
      x1: walk.x0,
      y1: yy,
      x2: walk.x0 + walk.ctx.bodyW,
      y2: yy,
      color: theme.accent,
      width: 1,
    });
  }
};

const emitSection = (
  walk: Walk,
  section: DocumentSection,
  y: number,
): number => {
  const { ctx } = walk;
  const gap = RHYTHM[ctx.theme.density];
  let dy = 0;
  if (section.title !== undefined) {
    emitSectionTitle(walk, section, y);
    dy += sectionTitleHeight(ctx) + gap;
  }
  for (const row of section.rows) {
    const colW = rowColumnWidth(ctx, row.slots.length);
    row.slots.forEach((slot, i) => {
      const x = walk.x0 + i * (colW + gap * 1.4);
      slotPrims(
        { ctx, x, y: y + dy, w: colW, emit: (p) => walk.out.push(p) },
        slot,
      );
    });
    dy += rowHeight(ctx, row) + gap;
  }
  return dy - gap;
};

const emitFooter = (walk: Walk, pageIndex: number, pageCount: number): void => {
  const { ctx, doc } = walk;
  const y =
    PAPER_PT[doc.paper].h -
    ctx.theme.margins.bottom -
    footerHeight(ctx, walk.doc);
  const dy = doc.footer ? emitBandRows(walk, doc.footer, y) : 0;
  if (pageCount > 1) {
    const size = ctx.theme.basePt * 0.72;
    walk.out.push({
      kind: 'text',
      x: walk.x0 + ctx.bodyW,
      y: y + dy + 2,
      text: `${pageIndex + 1} / ${pageCount}`,
      sizePt: size,
      weight: 400,
      color: DOC_INK_MUTED,
      lineH: size * 1.35,
      align: 'right',
    });
  }
};

/** All pages, as painter-ready primitives. */
export const documentPrims = (
  doc: PaginatedDocument,
  measure: TextMeasure,
): ReadonlyArray<readonly DocPrim[]> => {
  const ctx = layoutCtx(doc, measure);
  const gap = RHYTHM[doc.theme.density];
  return doc.pages.map((page, pageIndex) => {
    const out: DocPrim[] = [];
    const walk: Walk = { ctx, doc, out, x0: doc.theme.margins.left };
    const first = pageIndex === 0;
    let y = doc.theme.margins.top;
    const bandUsed = doc.header ? emitBandRows(walk, doc.header, y) : 0;
    if (first) emitTitle(walk, y + bandUsed);
    const headerH = headerHeight(ctx, doc, first);
    y += headerH + (headerH > 0 ? gap * 1.6 : 0);
    for (const section of page.sections) {
      y += emitSection(walk, section, y) + gap * 1.8;
    }
    emitFooter(walk, pageIndex, doc.pages.length);
    return out;
  });
};
