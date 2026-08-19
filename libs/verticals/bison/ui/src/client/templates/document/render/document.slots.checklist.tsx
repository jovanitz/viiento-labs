/**
 * The checklist presenter. Real drawn boxes rather than ☐/☒ glyphs: box
 * characters render differently in every font and would be the one thing
 * on the page that shifts when a theme changes its family.
 */
import { HAIRLINE } from './document.ink';
import type { Pt } from './document.ink';
import type { ChecklistItemVM, DocumentThemeVM } from '../document.types';

const Checkbox = ({
  item,
  theme,
  pt,
}: {
  readonly item: ChecklistItemVM;
  readonly theme: DocumentThemeVM;
  readonly pt: Pt;
}) => {
  const box = pt(theme.basePt * 0.95);
  return (
    <span style={{ display: 'flex', alignItems: 'flex-start', gap: pt(5) }}>
      <svg
        width={box}
        height={box}
        viewBox="0 0 16 16"
        style={{ flexShrink: 0, marginTop: pt(1) }}
        role="presentation"
      >
        <rect
          x={1}
          y={1}
          width={14}
          height={14}
          rx={2}
          fill="none"
          stroke={item.checked ? theme.accent : HAIRLINE}
          strokeWidth={1.4}
        />
        {item.checked ? (
          <path
            d="M4 8.5l2.8 2.8L12 5.8"
            fill="none"
            stroke={theme.accent}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
      <span>{item.text}</span>
    </span>
  );
};

export const ChecklistItems = ({
  items,
  theme,
  pt,
}: {
  readonly items: readonly ChecklistItemVM[];
  readonly theme: DocumentThemeVM;
  readonly pt: Pt;
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: pt(4),
      fontSize: pt(theme.basePt),
      lineHeight: 1.45,
    }}
  >
    {items.map((item) => (
      <Checkbox key={item.text} item={item} theme={theme} pt={pt} />
    ))}
  </div>
);
