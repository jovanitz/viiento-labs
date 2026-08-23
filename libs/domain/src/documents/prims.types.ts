/**
 * The primitive vocabulary a painter consumes — text runs, lines, rects,
 * images — plus the small shared emit helpers. Coordinates are
 * page-absolute points, y grows DOWN; the painter (PDF adapter) flips
 * axes and never decides geometry.
 */
import { DOC_INK_MUTED } from './model';
import { wrapText } from './measure';
import type { TextStyle } from './measure';
import type { LayoutCtx } from './heights';

export type DocPrim =
  | {
      readonly kind: 'text';
      readonly x: number;
      /** Top of the line box; the painter derives the baseline. */
      readonly y: number;
      readonly text: string;
      readonly sizePt: number;
      readonly weight: TextStyle['weight'];
      readonly color: string;
      /** Line-box height, for baseline placement. */
      readonly lineH: number;
      readonly align?: 'left' | 'right';
    }
  | {
      readonly kind: 'line';
      readonly x1: number;
      readonly y1: number;
      readonly x2: number;
      readonly y2: number;
      readonly color: string;
      readonly width: number;
    }
  | {
      readonly kind: 'rect';
      readonly x: number;
      readonly y: number;
      readonly w: number;
      readonly h: number;
      readonly stroke?: string;
      readonly fill?: string;
    }
  | {
      readonly kind: 'image';
      readonly x: number;
      readonly y: number;
      /** Bounding box; the painter contain-fits the decoded image. */
      readonly w: number;
      readonly h: number;
      readonly dataUrl: string;
    };

type Emit = (prim: DocPrim) => void;

type SlotBox = {
  readonly ctx: LayoutCtx;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly emit: Emit;
};

export const textLines = (
  box: SlotBox,
  text: string,
  style: Omit<TextStyle, 'family'> & { readonly color: string },
  atY: number,
): number => {
  const full: TextStyle = {
    family: box.ctx.theme.family,
    sizePt: style.sizePt,
    weight: style.weight,
  };
  const lineH = style.sizePt * 1.3;
  const lines = wrapText(text, full, box.w, box.ctx.measure);
  lines.forEach((line, i) =>
    box.emit({
      kind: 'text',
      x: box.x,
      y: atY + i * lineH,
      text: line,
      sizePt: style.sizePt,
      weight: style.weight,
      color: style.color,
      lineH,
    }),
  );
  return lines.length * lineH;
};

/** Label above its value (uppercase, muted) — or nothing, per theme. */
export const emitLabel = (box: SlotBox, label: string): number => {
  const { theme } = box.ctx;
  if (theme.labels !== 'above') return 0;
  const size = theme.basePt * 0.72;
  box.emit({
    kind: 'text',
    x: box.x,
    y: box.y,
    text: label.toUpperCase(),
    sizePt: size,
    weight: 600,
    color: DOC_INK_MUTED,
    lineH: size * 1.2,
  });
  return size * 1.2 + 3;
};


export type { SlotBox };
