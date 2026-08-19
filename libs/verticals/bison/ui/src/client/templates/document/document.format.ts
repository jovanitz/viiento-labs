/**
 * Formats (ADR-0021) — the account-level wrapper a printed template gets:
 * theme, paper, letterhead, footer and marks. The BODY is never in a
 * format; it derives from the template's own capture schema
 * (document.compose.ts), which is what lets every template print itself
 * with zero layout work.
 *
 * Shipped formats are product artifacts, like themes: starting points the
 * business edits or adds to. Their names are placeholders pending the
 * owner's naming pass.
 */
import type { DocumentToken } from './document.tokens';
import type { MarkVM, PaperKind } from './document.types';

export type DocumentFormat = {
  readonly id: string;
  readonly name: string;
  readonly themeId: string;
  readonly paper: PaperKind;
  /** Letterhead — one account token per line, in order. */
  readonly headerTokens: readonly DocumentToken[];
  /** Provenance line(s) under the body, same shape. */
  readonly footerTokens: readonly DocumentToken[];
  readonly marks: readonly MarkVM[];
};

/** Where each mark asset lands when toggled on — the business picks WHICH
 *  marks, never where (ADR-0020 §2 still holds for marks). */
export const MARK_DEFAULTS: Record<MarkVM['asset'], MarkVM> = {
  logo: { id: 'logo', asset: 'logo', region: 'header', corner: 'left' },
  qr: { id: 'qr', asset: 'qr', region: 'header', corner: 'right' },
  seal: { id: 'seal', asset: 'seal', region: 'header', corner: 'right' },
  signature: {
    id: 'signature',
    asset: 'signature',
    region: 'footer',
    corner: 'right',
  },
};

export const toggleMark = (
  marks: readonly MarkVM[],
  asset: MarkVM['asset'],
): readonly MarkVM[] =>
  marks.some((m) => m.asset === asset)
    ? marks.filter((m) => m.asset !== asset)
    : [...marks, MARK_DEFAULTS[asset]];

export const toggleToken = (
  list: readonly DocumentToken[],
  token: DocumentToken,
): readonly DocumentToken[] =>
  list.includes(token) ? list.filter((t) => t !== token) : [...list, token];

export const upsertFormat = (
  formats: readonly DocumentFormat[],
  format: DocumentFormat,
): readonly DocumentFormat[] =>
  formats.some((f) => f.id === format.id)
    ? formats.map((f) => (f.id === format.id ? format : f))
    : [...formats, format];

export const SHIPPED_FORMATS: readonly DocumentFormat[] = [
  {
    id: 'fmt-prescription',
    name: 'Prescription',
    themeId: 'clinical',
    paper: 'letter',
    headerTokens: ['business.name', 'business.address', 'business.phone'],
    footerTokens: ['document.folio', 'document.issuedAt'],
    marks: [MARK_DEFAULTS.logo, MARK_DEFAULTS.qr, MARK_DEFAULTS.signature],
  },
  {
    id: 'fmt-instructions',
    name: 'Instructions',
    themeId: 'minimal',
    paper: 'half-letter',
    headerTokens: ['business.name', 'business.phone'],
    footerTokens: [],
    marks: [MARK_DEFAULTS.logo],
  },
  {
    id: 'fmt-plain',
    name: 'Plain page',
    themeId: 'formal',
    paper: 'letter',
    headerTokens: ['business.name'],
    footerTokens: ['document.issuedAt'],
    marks: [],
  },
];
