/**
 * Rows, sections and bands — the flow layout that replaces free x/y
 * (ADR-0020 §2). A row's slots share its width evenly; sections stack;
 * bands repeat per page. Nothing here can overlap, because nothing here
 * has a coordinate.
 */
import type { CSSProperties, ReactNode } from 'react';
import { HAIRLINE, INK, INK_MUTED, tint } from './document.ink';
import type { Pt } from './document.ink';
import { RHYTHM } from '../document.themes';
import { MarkGroup } from './document.marks';
import { Slot } from './document.slots';
import type { SlotVariant } from './document.slots';
import type {
  BandVM,
  DocumentThemeVM,
  MarkVM,
  RowVM,
  SectionVM,
} from '../document.types';

/** Slots share the row evenly. That even split IS the layout model — the
 *  business groups fields into a row and never types a coordinate. */
export const Row = ({
  row,
  theme,
  pt,
  variant = 'body',
}: {
  readonly row: RowVM;
  readonly theme: DocumentThemeVM;
  readonly pt: Pt;
  readonly variant?: SlotVariant;
}) => {
  // When the theme draws a rule, the RULES are what the eye lines up on,
  // so cells stretch and sit their content on a shared baseline — a value
  // that wraps to two lines must not drag its underline out of line with
  // its neighbours. Ruleless themes align on the labels at the top.
  const ruled = theme.fieldRule !== 'none' && variant === 'body';
  return (
    <div
      style={{
        display: 'flex',
        gap: pt(RHYTHM[theme.density] * 1.4),
        alignItems: ruled ? 'stretch' : 'flex-start',
      }}
    >
      {row.slots.map((slot, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: ruled ? 'flex-end' : 'flex-start',
          }}
        >
          <Slot slot={slot} theme={theme} pt={pt} variant={variant} />
        </div>
      ))}
    </div>
  );
};

/** A band's first row is the identity line and leads; the rest is the
 *  supporting detail beneath it. */
const BandRows = ({
  rows,
  theme,
  pt,
  gap,
}: {
  readonly rows: readonly RowVM[];
  readonly theme: DocumentThemeVM;
  readonly pt: Pt;
  readonly gap: number;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap, flex: 1 }}>
    {rows.map((row, i) => (
      <Row
        key={i}
        row={row}
        theme={theme}
        pt={pt}
        variant={i === 0 ? 'band-lead' : 'band'}
      />
    ))}
  </div>
);

const titleStyle = (theme: DocumentThemeVM, pt: Pt): CSSProperties => ({
  fontSize: pt(theme.basePt * theme.scale * 0.82),
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  margin: 0,
});

const SectionTitle = ({
  title,
  theme,
  pt,
}: {
  readonly title: string;
  readonly theme: DocumentThemeVM;
  readonly pt: Pt;
}) => {
  const base = titleStyle(theme, pt);
  if (theme.sectionRule === 'band')
    return (
      <h2
        style={{
          ...base,
          color: theme.accent,
          background: tint(theme.accent, 0.1),
          padding: `${pt(4)}px ${pt(7)}px`,
          borderRadius: pt(2.5),
        }}
      >
        {title}
      </h2>
    );
  if (theme.sectionRule === 'line')
    return (
      <h2
        style={{
          ...base,
          color: INK,
          borderBottom: `1px solid ${theme.accent}`,
          paddingBottom: pt(3),
        }}
      >
        {title}
      </h2>
    );
  return <h2 style={{ ...base, color: INK_MUTED }}>{title}</h2>;
};

export const Section = ({
  section,
  theme,
  pt,
}: {
  readonly section: SectionVM;
  readonly theme: DocumentThemeVM;
  readonly pt: Pt;
}) => {
  const gap = pt(RHYTHM[theme.density]);
  const boxed = section.emphasis === 'boxed';
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        opacity: section.emphasis === 'quiet' ? 0.75 : 1,
        border: boxed ? `1px solid ${HAIRLINE}` : undefined,
        borderRadius: boxed ? pt(3) : undefined,
        padding: boxed ? pt(RHYTHM[theme.density]) : undefined,
      }}
    >
      {section.title ? (
        <SectionTitle title={section.title} theme={theme} pt={pt} />
      ) : null}
      {section.rows.map((row, i) => (
        <Row key={i} row={row} theme={theme} pt={pt} />
      ))}
    </section>
  );
};

/**
 * A repeating region. Band rows ride with the left corner so identity text
 * and the logo read as one block; centre and right hold marks only.
 */
export const Band = ({
  band,
  marks,
  theme,
  pt,
  children,
}: {
  readonly band?: BandVM | undefined;
  readonly marks: readonly MarkVM[];
  readonly theme: DocumentThemeVM;
  readonly pt: Pt;
  readonly children?: ReactNode;
}) => {
  if (!band && marks.length === 0 && !children) return null;
  const at = (corner: MarkVM['corner']) =>
    marks.filter((m) => m.corner === corner);
  const gap = pt(RHYTHM[theme.density]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      <div
        style={{
          display: 'flex',
          gap: pt(RHYTHM[theme.density] * 1.4),
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap, alignItems: 'center', flex: 1 }}>
          <MarkGroup marks={at('left')} theme={theme} pt={pt} />
          {band ? (
            <BandRows rows={band.rows} theme={theme} pt={pt} gap={pt(4)} />
          ) : null}
        </div>
        <MarkGroup marks={at('center')} theme={theme} pt={pt} />
        <MarkGroup marks={at('right')} theme={theme} pt={pt} />
      </div>
      {children}
    </div>
  );
};
