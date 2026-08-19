/**
 * Sample values for the layout preview, DERIVED from each block's kind
 * rather than written per template. Authored samples read as somebody's
 * real record, which makes a layout preview look like data the business
 * never entered — and the app has no business inventing a client's
 * history to show a page shape.
 *
 * Choice kinds are the exception worth noting: their sample is the
 * template's OWN first option, so it is real content, not filler.
 *
 * `stress` is the case that matters (ADR-0020 §10) — the longest value a
 * field can plausibly hold, which is what breaks a page.
 */
import type { EntryValues } from '../document.compose';
import type { EntryTemplate, TemplateBlock } from '../../templates.types';

export type SampleKind = 'typical' | 'stress';

const WORD = 'sample';
/** Filler of a given word count — long enough to wrap, boring enough to
 *  never be mistaken for a record. */
const filler = (words: number) =>
  Array.from({ length: words }, (_, i) => (i === 0 ? 'Sample' : WORD)).join(
    ' ',
  );

const TYPICAL: Record<string, string> = {
  'short-text': filler(3),
  'long-text': filler(24),
  number: '12',
  date: '01/01/2026',
  time: '09:00',
  file: 'sample.pdf',
  signature: filler(2),
};

const STRESS: Record<string, string> = {
  ...TYPICAL,
  'short-text': filler(9),
  'long-text': [filler(40), filler(38), filler(44)].join('\n'),
  signature: filler(5),
};

const sampleFor = (block: TemplateBlock, kind: SampleKind): string => {
  // A choice block's own options are real content — no need to invent.
  if (block.options && block.options.length > 0)
    return (
      (kind === 'stress'
        ? block.options[block.options.length - 1]
        : block.options[0]) ?? ''
    );
  return (kind === 'stress' ? STRESS : TYPICAL)[block.kind] ?? filler(3);
};

export const sampleValues = (
  template: EntryTemplate,
  kind: SampleKind,
): EntryValues =>
  Object.fromEntries(template.blocks.map((b) => [b.id, sampleFor(b, kind)]));
