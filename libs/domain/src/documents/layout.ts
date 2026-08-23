/**
 * The paginator — cuts the flowing body into pages using the height model
 * (heights.ts). A row never splits; a section title stays glued to its
 * first row; a row taller than a whole page overflows visibly rather than
 * disappearing. Conservative by design: heights round up, so estimation
 * error paginates early (visible slack), never clips.
 */
import { PAPER_PT, RHYTHM } from './model';
import type {
  DocumentModel,
  DocumentRow,
  DocumentSection,
  PaginatedDocument,
} from './model';
import type { TextMeasure } from './measure';
import {
  footerHeight,
  headerHeight,
  layoutCtx,
  rowHeight,
  sectionTitleHeight,
} from './heights';
import type { LayoutCtx } from './heights';

type Unit = {
  readonly section: DocumentSection;
  readonly row: DocumentRow;
  /** First row of its section: carries the title and the section gap. */
  readonly leads: boolean;
  readonly height: number;
};

const unitsOf = (ctx: LayoutCtx, model: DocumentModel): readonly Unit[] =>
  model.sections.flatMap((section) =>
    section.rows.map((row, i) => ({
      section,
      row,
      leads: i === 0,
      height:
        rowHeight(ctx, row) +
        (i === 0 && section.title !== undefined
          ? sectionTitleHeight(ctx) + RHYTHM[ctx.theme.density]
          : 0),
    })),
  );

const placeUnit = (
  pages: DocumentSection[][],
  unit: Unit,
  fresh: boolean,
): void => {
  const page = pages[pages.length - 1] as DocumentSection[];
  const last = page[page.length - 1];
  if (!fresh && last !== undefined && last.id === unit.section.id) {
    page[page.length - 1] = { ...last, rows: [...last.rows, unit.row] };
    return;
  }
  const { title, ...rest } = unit.section;
  page.push({
    ...rest,
    ...(unit.leads && title !== undefined ? { title } : {}),
    rows: [unit.row],
  });
};

/**
 * Cut the flowing body into pages. A row never splits; a section's title
 * stays glued to its first row; a row taller than a whole page overflows
 * visibly rather than disappearing. Conservative by design — see header.
 */
export const paginateDocument = (
  model: DocumentModel,
  measure: TextMeasure,
): PaginatedDocument => {
  const ctx = layoutCtx(model, measure);
  const { theme } = model;
  const gap = RHYTHM[theme.density];
  const paperH = PAPER_PT[model.paper].h;
  const footerH = footerHeight(ctx, model);
  const chrome = (first: boolean): number => {
    const headerH = headerHeight(ctx, model, first);
    const regionGaps = (headerH > 0 ? 1 : 0) + (footerH > 0 ? 1 : 0);
    return (
      theme.margins.top +
      theme.margins.bottom +
      headerH +
      footerH +
      regionGaps * gap * 1.6
    );
  };

  const pages: DocumentSection[][] = [[]];
  let used = 0;
  let available = paperH - chrome(true);
  for (const unit of unitsOf(ctx, model)) {
    const page = pages[pages.length - 1] as DocumentSection[];
    const sectionGap = unit.leads ? gap * 1.8 : gap;
    const spacing = page.length === 0 ? 0 : sectionGap;
    const fits = used + spacing + unit.height <= available;
    if (!fits && page.length > 0) {
      pages.push([]);
      available = paperH - chrome(false);
      used = unit.height;
      placeUnit(pages, unit, true);
      continue;
    }
    used += spacing + unit.height;
    placeUnit(pages, unit, false);
  }

  return {
    title: model.title,
    paper: model.paper,
    theme: model.theme,
    ...(model.header ? { header: model.header } : {}),
    ...(model.footer ? { footer: model.footer } : {}),
    marks: model.marks,
    pages: pages.map((sections) => ({ sections })),
  };
};
