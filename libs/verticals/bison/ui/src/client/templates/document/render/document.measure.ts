/**
 * The preview's text metrics — canvas `measureText` over the SAME font
 * files the app loads via @font-face and the PDF adapter embeds, so the
 * engine paginates with the numbers both consumers will actually draw
 * with. Injected into the engine (ADR-0020: the domain never measures
 * text itself); outside a browser (stories under node, specs) it degrades
 * to a deterministic glyph estimate.
 */
import { FONT_STACK } from '../document.themes';
import type { TextMeasure, TextStyle } from '@acme/application';

const AVG_GLYPH = 0.52;

const fallback: TextMeasure = (text, style) =>
  text.length * style.sizePt * AVG_GLYPH;

let context: CanvasRenderingContext2D | null | undefined;

const canvasContext = (): CanvasRenderingContext2D | null => {
  if (context !== undefined) return context;
  context =
    typeof document === 'undefined'
      ? null
      : document.createElement('canvas').getContext('2d');
  return context;
};

const cssFont = (style: TextStyle): string =>
  `${style.weight} ${style.sizePt}px ${FONT_STACK[style.family]}`;

/** Width of one line, in points (canvas px at font-size pt = pt). */
export const canvasTextMeasure: TextMeasure = (text, style) => {
  const ctx = canvasContext();
  if (!ctx) return fallback(text, style);
  ctx.font = cssFont(style);
  // A hair of slack: canvas and the embedded font can disagree by a
  // sub-pixel per glyph, and the engine must err toward wrapping early.
  return ctx.measureText(text).width * 1.02;
};
