import { describe, expect, it } from 'vitest';
import type { DocumentModel, DocumentTheme } from './model';
import type { TextMeasure } from './measure';
import { wrapText } from './measure';
import { paginateDocument } from './layout';
import { documentPrims } from './prims';

/** Deterministic fake metrics: every glyph is half the font size wide. */
const measure: TextMeasure = (text, style) => text.length * style.sizePt * 0.5;

const THEME: DocumentTheme = {
  id: 'clinical',
  name: 'Clinical',
  blurb: '',
  family: 'sans',
  basePt: 10,
  scale: 1.2,
  density: 'compact',
  labels: 'above',
  fieldRule: 'underline',
  sectionRule: 'line',
  accent: '#0f766e',
  margins: { top: 40, right: 44, bottom: 40, left: 44 },
};

const field = (label: string, value: string) => ({
  kind: 'field' as const,
  label,
  value,
});

const model = (rows: number, valueLen = 10): DocumentModel => ({
  title: 'Consulta',
  paper: 'letter',
  theme: THEME,
  marks: [],
  header: {
    rows: [
      { slots: [{ kind: 'token', label: 'Business name', value: 'Aurora' }] },
    ],
  },
  footer: { rows: [] },
  sections: [
    {
      id: 'body',
      title: 'Datos',
      rows: Array.from({ length: rows }, (_, i) => ({
        slots: [field(`Campo ${i}`, 'x'.repeat(valueLen))],
      })),
    },
  ],
});

describe('wrapText', () => {
  const style = { family: 'sans' as const, sizePt: 10, weight: 400 as const };

  it('wraps greedily at the column width', () => {
    // Each word is 4 chars → 20pt; two words + space fit in 45pt, not three.
    const lines = wrapText('aaaa bbbb cccc', style, 45, measure);
    expect(lines).toEqual(['aaaa bbbb', 'cccc']);
  });

  it('honors explicit newlines and keeps empty text one line tall', () => {
    expect(wrapText('a\nb', style, 100, measure)).toEqual(['a', 'b']);
    expect(wrapText('', style, 100, measure)).toEqual(['']);
  });

  it('hard-breaks a single token wider than the column', () => {
    const lines = wrapText('x'.repeat(30), style, 50, measure);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join('')).toBe('x'.repeat(30));
  });
});

describe('paginateDocument', () => {
  it('keeps a short document on one page, body intact', () => {
    const paged = paginateDocument(model(4), measure);
    expect(paged.pages).toHaveLength(1);
    expect(paged.pages[0]?.sections[0]?.rows).toHaveLength(4);
  });

  it('cuts a long body into pages without losing or reordering rows', () => {
    const paged = paginateDocument(model(60), measure);
    expect(paged.pages.length).toBeGreaterThan(1);
    const labels = paged.pages
      .flatMap((p) => p.sections)
      .flatMap((s) => s.rows)
      .map((r) => (r.slots[0] as { label: string }).label);
    expect(labels).toEqual(Array.from({ length: 60 }, (_, i) => `Campo ${i}`));
  });

  it('repeats the section id on continuation pages but not its title', () => {
    const paged = paginateDocument(model(60), measure);
    const [first, second] = paged.pages;
    expect(first?.sections[0]?.title).toBe('Datos');
    expect(second?.sections[0]?.id).toBe('body');
    expect(second?.sections[0]?.title).toBeUndefined();
  });

  it('places an oversized row alone instead of dropping it', () => {
    const paged = paginateDocument(model(1, 8000), measure);
    expect(paged.pages).toHaveLength(1);
    expect(paged.pages[0]?.sections[0]?.rows).toHaveLength(1);
  });
});

describe('documentPrims', () => {
  it('draws the title on the first page only, page numbers on all', () => {
    const paged = paginateDocument(model(60), measure);
    const pages = documentPrims(paged, measure);
    const texts = (i: number) =>
      pages[i]?.flatMap((p) => (p.kind === 'text' ? [p.text] : [])) ?? [];
    expect(texts(0)).toContain('Consulta');
    expect(texts(1)).not.toContain('Consulta');
    expect(texts(0)).toContain(`1 / ${pages.length}`);
    expect(texts(1)).toContain(`2 / ${pages.length}`);
  });

  it('renders values as text runs and rules as lines', () => {
    const paged = paginateDocument(model(2), measure);
    const prims = documentPrims(paged, measure)[0] ?? [];
    const texts = prims.flatMap((p) => (p.kind === 'text' ? [p.text] : []));
    expect(texts).toContain('xxxxxxxxxx');
    expect(texts).toContain('CAMPO 0');
    expect(prims.some((p) => p.kind === 'line')).toBe(true);
  });
});
