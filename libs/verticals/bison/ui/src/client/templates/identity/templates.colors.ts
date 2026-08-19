/**
 * Per-template accent color — the recognition handle. A business with
 * eight templates tells them apart the way calendars tell calendars
 * apart: the hue follows the template everywhere its icon does (gallery
 * card, picker, timeline entry, builder preview), so "which form am I
 * in?" is answered before reading a label.
 *
 * The palette is closed and ours, like themes and fonts: the business
 * picks a hue per template, it never types a color. Tints stay soft
 * (bg at 15%) so color identifies without shouting; `edge` is the accent
 * line an expanded timeline entry carries.
 */
export type TemplateColor =
  | 'gray'
  | 'teal'
  | 'blue'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'green';

export const TEMPLATE_COLORS: readonly TemplateColor[] = [
  'gray',
  'teal',
  'blue',
  'violet',
  'amber',
  'rose',
  'green',
];

type ColorClasses = {
  /** Icon chip: soft tinted background + legible glyph in both modes. */
  readonly chip: string;
  /** Accent line on an expanded timeline entry. */
  readonly edge: string;
  /** Solid dot for the builder's color picker. */
  readonly swatch: string;
};

/** Static strings on purpose — Tailwind only ships classes it can see. */
export const COLOR_CLASSES: Record<TemplateColor, ColorClasses> = {
  gray: {
    chip: 'bg-muted text-muted-foreground',
    edge: 'border-border',
    swatch: 'bg-muted-foreground/50',
  },
  teal: {
    chip: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    edge: 'border-teal-500/50',
    swatch: 'bg-teal-500',
  },
  blue: {
    chip: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    edge: 'border-blue-500/50',
    swatch: 'bg-blue-500',
  },
  violet: {
    chip: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    edge: 'border-violet-500/50',
    swatch: 'bg-violet-500',
  },
  amber: {
    chip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    edge: 'border-amber-500/50',
    swatch: 'bg-amber-500',
  },
  rose: {
    chip: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    edge: 'border-rose-500/50',
    swatch: 'bg-rose-500',
  },
  green: {
    chip: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    edge: 'border-emerald-500/50',
    swatch: 'bg-emerald-500',
  },
};
