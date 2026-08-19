/**
 * One already-paginated page of a DocumentVM. Not a `*.view.tsx`: it is
 * the drawing primitive the preview composes, with no ViewModel/actions
 * contract of its own.
 *
 * Two rules hold the page together: geometry arrives in POINTS and is
 * scaled to pixels exactly once (through `pt`), and every size derives
 * from the theme (basePt, scale, RHYTHM) — there are no magic pixel
 * values, which is what keeps the page on a grid under any theme.
 */
import { Band, Section } from './document.blocks';
import { INK, INK_MUTED } from './document.ink';
import { FONT_STACK, PAPER_PT, RHYTHM } from '../document.themes';
import type { DocumentPageVM, DocumentVM } from '../document.types';

const DocumentTitle = ({
  doc,
  pt,
}: {
  readonly doc: DocumentVM;
  readonly pt: (points: number) => number;
}) => {
  const { theme } = doc;
  return (
    <h1
      style={{
        // Two steps up the scale, plus a nudge: the title has to be the
        // page's single focal point, above the letterhead beside it.
        fontSize: pt(theme.basePt * theme.scale * theme.scale * 1.15),
        fontWeight: 700,
        letterSpacing: theme.family === 'serif' ? undefined : '-0.01em',
        margin: 0,
        paddingTop: pt(RHYTHM[theme.density] * 0.5),
      }}
    >
      {doc.title}
    </h1>
  );
};

const PageHeader = ({
  doc,
  first,
  pt,
}: {
  readonly doc: DocumentVM;
  readonly first: boolean;
  readonly pt: (points: number) => number;
}) => (
  <Band
    band={doc.header}
    marks={doc.marks.filter((m) => m.region === 'header')}
    theme={doc.theme}
    pt={pt}
  >
    {/* The title belongs to the first page only — repeating it on a
        continuation page reads as a second document. */}
    {first ? <DocumentTitle doc={doc} pt={pt} /> : null}
  </Band>
);

const PageFooter = ({
  doc,
  pageIndex,
  pageCount,
  pt,
}: {
  readonly doc: DocumentVM;
  readonly pageIndex: number;
  readonly pageCount: number;
  readonly pt: (points: number) => number;
}) => (
  <Band
    band={doc.footer}
    marks={doc.marks.filter((m) => m.region === 'footer')}
    theme={doc.theme}
    pt={pt}
  >
    {pageCount > 1 ? (
      <span
        style={{
          fontSize: pt(doc.theme.basePt * 0.72),
          color: INK_MUTED,
          textAlign: 'right',
        }}
      >
        {pageIndex + 1} / {pageCount}
      </span>
    ) : null}
  </Band>
);

export const DocumentPageSurface = ({
  doc,
  page,
  pageIndex,
  pageCount,
  scale,
}: {
  readonly doc: DocumentVM;
  readonly page: DocumentPageVM;
  readonly pageIndex: number;
  readonly pageCount: number;
  /** Pixels per point — the ONLY place screen units enter the document. */
  readonly scale: number;
}) => {
  const pt = (points: number) => points * scale;
  const { theme } = doc;
  const paper = PAPER_PT[doc.paper];
  const first = pageIndex === 0;

  return (
    <div
      data-print-page
      style={{
        width: pt(paper.w),
        height: pt(paper.h),
        background: '#fff',
        color: INK,
        fontFamily: FONT_STACK[theme.family],
        padding: `${pt(theme.margins.top)}px ${pt(theme.margins.right)}px ${pt(
          theme.margins.bottom,
        )}px ${pt(theme.margins.left)}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: pt(RHYTHM[theme.density] * 1.6),
        boxSizing: 'border-box',
        boxShadow: '0 1px 3px rgba(0,0,0,.16), 0 12px 32px rgba(0,0,0,.10)',
        overflow: 'hidden',
      }}
    >
      <PageHeader doc={doc} first={first} pt={pt} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: pt(RHYTHM[theme.density] * 1.8),
          minHeight: 0,
        }}
      >
        {page.sections.map((section) => (
          <Section key={section.id} section={section} theme={theme} pt={pt} />
        ))}
      </div>

      <PageFooter
        doc={doc}
        pageIndex={pageIndex}
        pageCount={pageCount}
        pt={pt}
      />
    </div>
  );
};
