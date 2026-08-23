/**
 * The page's own palette and unit. Paper is paper: a real white sheet with
 * near-black ink, deliberately NOT the app's surface tokens — the document
 * looks the same whichever theme the app is in, because it is going to be
 * printed. Ink is #1c1c1c rather than pure black; pure black on white
 * vibrates in print exactly as it does on screen.
 */

import { DOC_HAIRLINE, DOC_INK, DOC_INK_MUTED } from '@acme/application';

export const INK = DOC_INK;
export const INK_MUTED = DOC_INK_MUTED;
export const HAIRLINE = DOC_HAIRLINE;

/** Points → pixels. Passed down so screen units enter the document in
 *  exactly one place (the preview's zoom), never inside a renderer. */
export type Pt = (points: number) => number;

/** Adds an alpha channel to a 6-digit hex accent — theme accents are solid
 *  colors and every tint is derived, never authored separately. */
export const tint = (hex: string, alpha: number): string => {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
};

export const ALIGN_BY_CORNER = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
} as const;
