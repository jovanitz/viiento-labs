/**
 * Slot presenters — one renderer per kind, picked by the theme, never by
 * the business (ADR-0020 §5). A signature always prints as rule + name +
 * caption; a checklist always prints as real boxes. The business chooses
 * WHICH field goes where; how each kind looks is ours.
 */
import type { CSSProperties } from 'react';
import { HAIRLINE, INK, INK_MUTED } from './document.ink';
import type { Pt } from './document.ink';
import { RHYTHM } from '../document.themes';
import { ChecklistItems } from './document.slots.checklist';
import type { DocumentThemeVM, SlotVM } from '../document.types';

type SlotProps<K extends SlotVM['kind']> = {
  readonly slot: Extract<SlotVM, { kind: K }>;
  readonly theme: DocumentThemeVM;
  readonly pt: Pt;
};

/** Label treatment is the theme's call, never the slot's. */
const FieldLabel = ({
  text,
  theme,
  pt,
}: {
  readonly text: string;
  readonly theme: DocumentThemeVM;
  readonly pt: Pt;
}) => {
  if (theme.labels === 'hidden') return null;
  const above = theme.labels === 'above';
  return (
    <span
      style={{
        fontSize: pt(theme.basePt * 0.72),
        letterSpacing: above ? '0.07em' : undefined,
        textTransform: above ? 'uppercase' : undefined,
        fontWeight: 600,
        color: above ? INK_MUTED : INK,
        whiteSpace: 'nowrap',
      }}
    >
      {above ? text : `${text}: `}
    </span>
  );
};

const RULE: Record<DocumentThemeVM['fieldRule'], (pt: Pt) => CSSProperties> = {
  underline: (pt) => ({
    borderBottom: `1px solid ${HAIRLINE}`,
    paddingBottom: pt(2.5),
  }),
  box: (pt) => ({
    border: `1px solid ${HAIRLINE}`,
    borderRadius: pt(2.5),
    padding: `${pt(4)}px ${pt(6)}px`,
  }),
  none: () => ({}),
};

/**
 * Where a slot sits changes how it reads. In the body it is a captured
 * field and wants its label and rule; in a band it is letterhead, and a
 * labelled, ruled "Practice: Consultorio Aurora" reads as a form someone
 * filled in rather than as the business's own stationery — so bands drop
 * both, and lead with the identity line.
 */
export type SlotVariant = 'body' | 'band-lead' | 'band';

/** `field` and `token` share this presenter — they differ in provenance,
 *  not in looks. */
const ValueSlot = ({
  slot,
  theme,
  pt,
  variant,
}: SlotProps<'field' | 'token'> & { readonly variant: SlotVariant }) => {
  if (variant !== 'body')
    return (
      <span
        style={{
          display: 'block',
          fontSize: pt(theme.basePt * (variant === 'band-lead' ? 1.06 : 0.82)),
          fontWeight: variant === 'band-lead' ? 700 : 400,
          color: variant === 'band-lead' ? INK : INK_MUTED,
          lineHeight: 1.35,
          whiteSpace: 'pre-line',
        }}
      >
        {slot.value}
      </span>
    );
  return (
    <div
      style={{
        display: theme.labels === 'inline' ? 'block' : 'flex',
        flexDirection: 'column',
        gap: pt(3),
        fontSize: pt(theme.basePt),
        lineHeight: slot.multiline ? 1.55 : 1.3,
        ...RULE[theme.fieldRule](pt),
      }}
    >
      <FieldLabel text={slot.label} theme={theme} pt={pt} />
      <span style={{ whiteSpace: 'pre-line' }}>{slot.value}</span>
    </div>
  );
};

const StaticSlot = ({ slot, theme, pt }: SlotProps<'static'>) => (
  <p
    style={{
      fontSize: pt(theme.basePt * 0.85),
      color: INK_MUTED,
      lineHeight: 1.5,
      margin: 0,
    }}
  >
    {slot.text}
  </p>
);

const SignatureSlot = ({ slot, theme, pt }: SlotProps<'signature'>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: pt(3) }}>
    <div style={{ height: pt(26) }} />
    <div style={{ borderTop: `1px solid ${INK}` }} />
    <span style={{ fontSize: pt(theme.basePt), fontWeight: 600 }}>
      {slot.name}
    </span>
    <span style={{ fontSize: pt(theme.basePt * 0.75), color: INK_MUTED }}>
      {slot.label}
    </span>
  </div>
);

const ChecklistSlot = ({ slot, theme, pt }: SlotProps<'checklist'>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: pt(4) }}>
    <FieldLabel text={slot.label} theme={theme} pt={pt} />
    <ChecklistItems items={slot.items} theme={theme} pt={pt} />
  </div>
);

/** A captured file on paper: an image embeds (contained, bordered); any
 *  other file prints as its name — paper cannot open a PDF. */
const FileSlot = ({ slot, theme, pt }: SlotProps<'file'>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: pt(3) }}>
    <FieldLabel text={slot.label} theme={theme} pt={pt} />
    {slot.isImage && slot.dataUrl ? (
      <img
        src={slot.dataUrl}
        alt={slot.name}
        style={{
          maxWidth: '100%',
          maxHeight: pt(180),
          objectFit: 'contain',
          alignSelf: 'flex-start',
          border: `1px solid ${HAIRLINE}`,
          borderRadius: pt(2.5),
        }}
      />
    ) : (
      <span
        style={{
          fontSize: pt(theme.basePt),
          border: `1px solid ${HAIRLINE}`,
          borderRadius: pt(2.5),
          padding: `${pt(3)}px ${pt(6)}px`,
          alignSelf: 'flex-start',
        }}
      >
        {slot.name}
      </span>
    )}
  </div>
);

const SPACER_STEPS = { sm: 1, md: 2, lg: 3 } as const;

export const Slot = ({
  slot,
  theme,
  pt,
  variant = 'body',
}: {
  readonly slot: SlotVM;
  readonly theme: DocumentThemeVM;
  readonly pt: Pt;
  readonly variant?: SlotVariant;
}) => {
  switch (slot.kind) {
    case 'spacer':
      return (
        <div
          style={{
            height: pt(RHYTHM[theme.density] * SPACER_STEPS[slot.size]),
          }}
        />
      );
    case 'static':
      return <StaticSlot slot={slot} theme={theme} pt={pt} />;
    case 'signature':
      return <SignatureSlot slot={slot} theme={theme} pt={pt} />;
    case 'checklist':
      return <ChecklistSlot slot={slot} theme={theme} pt={pt} />;
    case 'file':
      return <FileSlot slot={slot} theme={theme} pt={pt} />;
    default:
      return <ValueSlot slot={slot} theme={theme} pt={pt} variant={variant} />;
  }
};
