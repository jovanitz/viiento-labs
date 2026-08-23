import { type Brand, type Result, err, ok } from '@acme/shared';
import { invalidFormat, invalidFormatId } from './errors';
import type { FormatDomainError } from './errors';

/**
 * A document Format (ADR-0021) — the account-level wrapper a printed
 * template gets: theme, paper, letterhead/footer TOKENS (never typed text,
 * ADR-0020 §4) and toggled marks. The BODY is never here; it derives from
 * the template's capture schema.
 *
 * Shipped formats stay product artifacts in the app (like themes); the
 * backend stores only the business's own rows. Editing a shipped one is
 * copy-on-write: the row carries `shippedKey` provenance so the catalog
 * knows which starting point it overrides (same pattern as role
 * templateKey, ADR-0012).
 */
export type DocumentFormatId = Brand<string, 'DocumentFormatId'>;

export const makeDocumentFormatId = (
  raw: string,
): Result<DocumentFormatId, FormatDomainError> => {
  const value = raw.trim();
  if (value.length === 0) {
    return err(invalidFormatId('Format id must not be empty.'));
  }
  return ok(value as DocumentFormatId);
};

export type PaperKind = 'letter' | 'a4' | 'half-letter';

export type DocumentToken =
  | 'business.name'
  | 'business.address'
  | 'business.phone'
  | 'business.license'
  | 'client.name'
  | 'document.folio'
  | 'document.issuedAt';

export type MarkAsset = 'logo' | 'signature' | 'seal' | 'qr';

export type FormatMark = {
  readonly id: string;
  readonly asset: MarkAsset;
  readonly region: 'header' | 'footer';
  readonly corner: 'left' | 'center' | 'right';
  /** Drawn beneath a signature mark (name, licence). */
  readonly caption?: string | undefined;
};

export type DocumentFormat = {
  readonly id: DocumentFormatId;
  readonly name: string;
  readonly themeId: string;
  readonly paper: PaperKind;
  /** Letterhead — one account token per line, in order. */
  readonly headerTokens: readonly DocumentToken[];
  /** Provenance line(s) under the body, same shape. */
  readonly footerTokens: readonly DocumentToken[];
  readonly marks: readonly FormatMark[];
  /** Set when this row overrides a shipped starting point. */
  readonly shippedKey?: string | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
};

const NAME_MAX = 80;
const CAPTION_MAX = 200;

const problemsOf = (input: {
  readonly name: string;
  readonly themeId: string;
  readonly headerTokens: readonly DocumentToken[];
  readonly footerTokens: readonly DocumentToken[];
  readonly marks: readonly FormatMark[];
}): readonly string[] => {
  const problems: string[] = [];
  const name = input.name.trim();
  if (name.length === 0) problems.push('name must not be empty');
  if (name.length > NAME_MAX) {
    problems.push(`name must be at most ${NAME_MAX} characters`);
  }
  if (input.themeId.trim().length === 0) {
    problems.push('themeId must not be empty');
  }
  for (const list of [input.headerTokens, input.footerTokens]) {
    if (new Set(list).size !== list.length) {
      problems.push('tokens must not repeat within a region');
    }
  }
  if (new Set(input.marks.map((m) => m.asset)).size !== input.marks.length) {
    problems.push('marks must not repeat an asset');
  }
  if (input.marks.some((m) => (m.caption ?? '').length > CAPTION_MAX)) {
    problems.push(`mark captions must be at most ${CAPTION_MAX} characters`);
  }
  return problems;
};

export const createDocumentFormat = (input: {
  readonly id: DocumentFormatId;
  readonly name: string;
  readonly themeId: string;
  readonly paper: PaperKind;
  readonly headerTokens: readonly DocumentToken[];
  readonly footerTokens: readonly DocumentToken[];
  readonly marks: readonly FormatMark[];
  readonly shippedKey?: string;
  readonly occurredAt: string;
}): Result<DocumentFormat, FormatDomainError> => {
  const problems = problemsOf(input);
  if (problems.length > 0) {
    return err(
      invalidFormat('The format is invalid.', { details: { problems } }),
    );
  }
  return ok({
    id: input.id,
    name: input.name.trim(),
    themeId: input.themeId.trim(),
    paper: input.paper,
    headerTokens: input.headerTokens,
    footerTokens: input.footerTokens,
    marks: input.marks,
    shippedKey: input.shippedKey,
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });
};

export type DocumentFormatChanges = {
  readonly name?: string;
  readonly themeId?: string;
  readonly paper?: PaperKind;
  readonly headerTokens?: readonly DocumentToken[];
  readonly footerTokens?: readonly DocumentToken[];
  readonly marks?: readonly FormatMark[];
};

export const updateDocumentFormat = (
  format: DocumentFormat,
  changes: DocumentFormatChanges,
  occurredAt: string,
): Result<DocumentFormat, FormatDomainError> => {
  const next = {
    name: changes.name ?? format.name,
    themeId: changes.themeId ?? format.themeId,
    paper: changes.paper ?? format.paper,
    headerTokens: changes.headerTokens ?? format.headerTokens,
    footerTokens: changes.footerTokens ?? format.footerTokens,
    marks: changes.marks ?? format.marks,
  };
  const problems = problemsOf(next);
  if (problems.length > 0) {
    return err(
      invalidFormat('The format is invalid.', { details: { problems } }),
    );
  }
  return ok({
    ...format,
    ...next,
    name: next.name.trim(),
    themeId: next.themeId.trim(),
    updatedAt: occurredAt,
  });
};
