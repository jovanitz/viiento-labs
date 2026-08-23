/**
 * The theme catalog — the aesthetic layer, authored by US and shipped with
 * the app (ADR-0020 §3). A business picks one and supplies three brand
 * levers (logo, accent, identity block); it never sets a type scale, a
 * margin or a rule style. That inversion is what gives every account the
 * same aesthetic floor instead of a floor that varies per customer.
 *
 * Four themes chosen to span the real space: dense-and-official,
 * traditional-and-formal, quiet-and-modern, branded.
 */
import type { DocumentThemeVM, FamilyKey } from './document.types';

// Geometry constants live with the engine now; the preview keeps reading
// them from here so the render files never changed their imports.
export { PAPER_PT, RHYTHM } from '@acme/application';

/** Only families we ship — the union is closed for a reason, see
 *  document.types.ts. */
export const FONT_STACK: Record<FamilyKey, string> = {
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  serif: "'Source Serif 4', Georgia, 'Times New Roman', serif",
  slab: "'Roboto Slab', 'Bookman Old Style', Georgia, serif",
};



/** Dense, official, label-forward. The default for records that get filed:
 *  much information per page, still legible at arm's length. */
const CLINICAL: DocumentThemeVM = {
  id: 'clinical',
  name: 'Clinical',
  blurb: 'Dense and official. Labelled fields, ruled sections.',
  family: 'sans',
  basePt: 9.5,
  scale: 1.18,
  density: 'compact',
  labels: 'above',
  fieldRule: 'underline',
  sectionRule: 'line',
  accent: '#0f766e',
  margins: { top: 40, right: 44, bottom: 40, left: 44 },
};

/** Traditional. Serif, inline labels, generous margins — reads as a letter
 *  or a certificate rather than a form. */
const FORMAL: DocumentThemeVM = {
  id: 'formal',
  name: 'Formal',
  blurb: 'Serif and roomy. Reads as a letter, not a form.',
  family: 'serif',
  basePt: 10.5,
  scale: 1.25,
  density: 'airy',
  labels: 'inline',
  fieldRule: 'none',
  sectionRule: 'band',
  accent: '#1e3a5f',
  margins: { top: 64, right: 72, bottom: 64, left: 72 },
};

/** Quiet and modern. No rules at all; hierarchy comes from type and space
 *  alone, which is the hardest to get right and the easiest to read. */
const MINIMAL: DocumentThemeVM = {
  id: 'minimal',
  name: 'Minimal',
  blurb: 'No rules, no boxes. Hierarchy from type and space.',
  family: 'sans',
  basePt: 10,
  scale: 1.32,
  density: 'regular',
  labels: 'above',
  fieldRule: 'none',
  sectionRule: 'none',
  accent: '#111827',
  margins: { top: 56, right: 60, bottom: 56, left: 60 },
};

/** Branded. Accent-tinted section bands and a strong header — for the
 *  business that wants the document to look like its own stationery. */
const LETTERHEAD: DocumentThemeVM = {
  id: 'letterhead',
  name: 'Letterhead',
  blurb: 'Accent bands and a strong header. Your stationery.',
  family: 'slab',
  basePt: 10,
  scale: 1.22,
  density: 'regular',
  labels: 'above',
  fieldRule: 'box',
  sectionRule: 'band',
  accent: '#7c3aed',
  margins: { top: 44, right: 52, bottom: 44, left: 52 },
};

export const DOCUMENT_THEMES: readonly DocumentThemeVM[] = [
  CLINICAL,
  FORMAL,
  MINIMAL,
  LETTERHEAD,
];

export const themeById = (id: string): DocumentThemeVM =>
  DOCUMENT_THEMES.find((t) => t.id === id) ?? CLINICAL;
