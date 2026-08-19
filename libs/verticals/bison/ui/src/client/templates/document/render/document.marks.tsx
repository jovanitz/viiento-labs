/**
 * Marks — the only free-positioned things on a page, and never data
 * (ADR-0020 §2): logo, signature, seal, QR. They anchor to a corner of a
 * region, not to an x/y, which is why a business can place them without
 * being able to wreck the layout.
 *
 * The glyphs are placeholders, but deliberately real-looking ones: a QR
 * with true finder squares occupies the visual weight the real mark will,
 * where a grey box would lie about it.
 */
import { ALIGN_BY_CORNER, HAIRLINE, INK, INK_MUTED } from './document.ink';
import type { Pt } from './document.ink';
import type { DocumentThemeVM, MarkVM } from '../document.types';

const inBox = (v: number, lo: number) => v >= lo && v < lo + 5;
const onEdge = (v: number, lo: number) => v === lo || v === lo + 4;

/** One finder square: ring plus centre dot, or `undefined` when the module
 *  falls outside this square entirely. */
const finderPixel = (
  r: number,
  c: number,
  r0: number,
  c0: number,
): boolean | undefined => {
  if (!inBox(r, r0) || !inBox(c, c0)) return undefined;
  return onEdge(r, r0) || onEdge(c, c0) || (r === r0 + 2 && c === c0 + 2);
};

const finderAt = (r: number, c: number, size: number): boolean | undefined => {
  const corners = [
    [0, 0],
    [0, size - 5],
    [size - 5, 0],
  ] as const;
  for (const [r0, c0] of corners) {
    const pixel = finderPixel(r, c, r0, c0);
    if (pixel !== undefined) return pixel;
  }
  return undefined;
};

/** Deterministic module grid — stable across renders, no randomness. */
const qrModules = (size: number): readonly (readonly boolean[])[] =>
  Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      const finder = finderAt(r, c, size);
      return finder ?? ((r * 7 + c * 13 + r * c * 3) % 5) % 2 === 0;
    }),
  );

const QrMark = ({ size }: { readonly size: number }) => (
  <svg width={size} height={size} viewBox="0 0 13 13" role="presentation">
    {qrModules(13).flatMap((row, r) =>
      row.map((on, c) =>
        on ? (
          <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={INK} />
        ) : null,
      ),
    )}
  </svg>
);

const SignatureMark = ({
  width,
  accent,
}: {
  readonly width: number;
  readonly accent: string;
}) => (
  <svg
    width={width}
    height={width * 0.38}
    viewBox="0 0 120 46"
    role="presentation"
  >
    <path
      d="M4 34c10-3 14-24 20-24s2 22 8 22 10-26 16-26 3 25 10 25 8-16 14-16 4 12 10 12 12-6 20-14"
      fill="none"
      stroke={accent}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);

const SealMark = ({
  size,
  accent,
}: {
  readonly size: number;
  readonly accent: string;
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" role="presentation">
    <circle
      cx={32}
      cy={32}
      r={30}
      fill="none"
      stroke={accent}
      strokeWidth={2}
    />
    <circle
      cx={32}
      cy={32}
      r={24}
      fill="none"
      stroke={accent}
      strokeWidth={0.75}
      strokeDasharray="3 2"
    />
    <path
      d="M22 33l7 7 14-15"
      fill="none"
      stroke={accent}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LogoMark = ({
  size,
  accent,
}: {
  readonly size: number;
  readonly accent: string;
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" role="presentation">
    <rect width={40} height={40} rx={9} fill={accent} />
    <path
      d="M12 27V13h6.5a4.5 4.5 0 010 9H12m8 5l-5-5"
      fill="none"
      stroke="#fff"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GLYPH: Record<
  MarkVM['asset'],
  (theme: DocumentThemeVM, pt: Pt) => React.ReactElement
> = {
  qr: (_theme, pt) => <QrMark size={pt(46)} />,
  signature: (theme, pt) => (
    <SignatureMark width={pt(108)} accent={theme.accent} />
  ),
  seal: (theme, pt) => <SealMark size={pt(52)} accent={theme.accent} />,
  logo: (theme, pt) => <LogoMark size={pt(34)} accent={theme.accent} />,
};

export const Mark = ({
  mark,
  theme,
  pt,
}: {
  readonly mark: MarkVM;
  readonly theme: DocumentThemeVM;
  readonly pt: Pt;
}) => {
  const ruled = mark.asset === 'signature';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: ALIGN_BY_CORNER[mark.corner],
        gap: pt(2),
      }}
    >
      {GLYPH[mark.asset](theme, pt)}
      {mark.caption ? (
        <span
          style={{
            fontSize: pt(theme.basePt * 0.72),
            color: INK_MUTED,
            borderTop: ruled ? `1px solid ${HAIRLINE}` : undefined,
            paddingTop: ruled ? pt(3) : 0,
            whiteSpace: 'pre-line',
            textAlign: mark.corner === 'right' ? 'right' : 'left',
            lineHeight: 1.35,
          }}
        >
          {mark.caption}
        </span>
      ) : null}
    </div>
  );
};

/** A corner's marks, or nothing at all — keeps the band's flex row free of
 *  empty placeholder divs. */
export const MarkGroup = ({
  marks,
  theme,
  pt,
}: {
  readonly marks: readonly MarkVM[];
  readonly theme: DocumentThemeVM;
  readonly pt: Pt;
}) => {
  if (marks.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: pt(10), alignItems: 'center' }}>
      {marks.map((m) => (
        <Mark key={m.id} mark={m} theme={theme} pt={pt} />
      ))}
    </div>
  );
};
