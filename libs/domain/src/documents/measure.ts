/**
 * Text measurement enters the engine through THIS function type, never
 * through an import (the domain runs in plain Node): the ui preview
 * supplies canvas metrics, the PDF adapter supplies the embedded font's
 * own metrics — both for the same shipped font files, so the numbers
 * agree.
 */
import type { FamilyKey } from './model';

export type TextStyle = {
  readonly family: FamilyKey;
  readonly sizePt: number;
  /** 400 body · 600 labels/names · 700 titles. ≥600 maps to the bold file. */
  readonly weight: 400 | 600 | 700;
};

/** Width of a single line of text, in points. */
export type TextMeasure = (text: string, style: TextStyle) => number;

const splitOversized = (
  word: string,
  style: TextStyle,
  maxWidthPt: number,
  measure: TextMeasure,
): readonly string[] => {
  const pieces: string[] = [];
  let piece = '';
  for (const char of word) {
    if (piece !== '' && measure(piece + char, style) > maxWidthPt) {
      pieces.push(piece);
      piece = char;
    } else {
      piece += char;
    }
  }
  if (piece !== '') pieces.push(piece);
  return pieces;
};

const wrapLine = (
  line: string,
  style: TextStyle,
  maxWidthPt: number,
  measure: TextMeasure,
): readonly string[] => {
  const out: string[] = [];
  let current = '';
  const flush = () => {
    if (current !== '') out.push(current);
    current = '';
  };
  for (const word of line.split(/\s+/).filter((w) => w.length > 0)) {
    const candidate = current === '' ? word : `${current} ${word}`;
    if (measure(candidate, style) <= maxWidthPt) {
      current = candidate;
      continue;
    }
    flush();
    if (measure(word, style) <= maxWidthPt) {
      current = word;
      continue;
    }
    // A single token wider than the column (a URL, a serial) hard-breaks.
    const pieces = splitOversized(word, style, maxWidthPt, measure);
    out.push(...pieces.slice(0, -1));
    current = pieces[pieces.length - 1] ?? '';
  }
  flush();
  return out.length > 0 ? out : [''];
};

/** Greedy word wrap. Honors explicit newlines (values render pre-line);
 *  an empty text still occupies one line, as it does on screen. */
export const wrapText = (
  text: string,
  style: TextStyle,
  maxWidthPt: number,
  measure: TextMeasure,
): readonly string[] =>
  text
    .split('\n')
    .flatMap((line) => wrapLine(line, style, maxWidthPt, measure));
