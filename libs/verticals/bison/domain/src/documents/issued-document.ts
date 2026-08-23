import { type Brand, type Result, err, ok } from '@acme/shared';
import { defineError, type TaggedError } from '@acme/shared';
import type { TemplateBlock } from '../templates/blocks';
import type { DocumentFormat, DocumentToken } from './format';

/**
 * An ISSUED document (ADR-0020 §7): emitting is not printing. The issue
 * records folio, when, by whom, where the rendered bytes live, and — the
 * point — a frozen snapshot of everything the page was composed from.
 * Editing the template or format afterwards changes future issues only;
 * reprinting a two-year-old document reproduces the two-year-old page.
 *
 * Issues are append-only: a mistake is VOIDED (optionally superseded by a
 * new issue), never edited. A voided folio stays on record — gaps and
 * voids are auditable, silent renumbering is not.
 */
export const invalidIssue = defineError('domain/invalid-issue');

export type IssueDomainError = TaggedError<'domain/invalid-issue'>;

export type IssuedDocumentId = Brand<string, 'IssuedDocumentId'>;

/** Everything composition needs, captured at issue time — self-contained,
 *  immune to later edits of template, format or identity. */
export type IssuedSnapshot = {
  readonly templateName: string;
  readonly blocks: readonly TemplateBlock[];
  readonly values: Readonly<Record<string, string>>;
  readonly format: DocumentFormat;
  readonly tokens: Readonly<Partial<Record<DocumentToken, string>>>;
};

export type IssuedDocument = {
  readonly id: IssuedDocumentId;
  readonly entryId: string;
  readonly clientId: string;
  /** Monotonic per account, server-allocated. Never reused, never renumbered. */
  readonly folio: number;
  readonly issuedAt: string;
  /** The actor's user id — who emitted, not who is on the page. */
  readonly issuedBy: string;
  readonly status: 'issued' | 'voided';
  /** The replacing issue, when a void was corrected by re-issuing. */
  readonly supersededBy?: string | undefined;
  /** Storage path of the rendered bytes; '' until the upload lands. */
  readonly pdfPath: string;
  readonly snapshot: IssuedSnapshot;
};

/** '0001' — folio as it prints. Grows past 4 digits naturally. */
export const folioLabel = (folio: number): string =>
  String(folio).padStart(4, '0');

export const createIssuedDocument = (input: {
  readonly id: IssuedDocumentId;
  readonly entryId: string;
  readonly clientId: string;
  readonly folio: number;
  readonly issuedAt: string;
  readonly issuedBy: string;
  readonly snapshot: IssuedSnapshot;
}): Result<IssuedDocument, IssueDomainError> => {
  if (!Number.isInteger(input.folio) || input.folio < 1) {
    return err(
      invalidIssue(`Folio must be a positive integer, got ${input.folio}.`),
    );
  }
  return ok({
    id: input.id,
    entryId: input.entryId,
    clientId: input.clientId,
    folio: input.folio,
    issuedAt: input.issuedAt,
    issuedBy: input.issuedBy,
    status: 'issued',
    pdfPath: '',
    snapshot: input.snapshot,
  });
};

/** The rendered bytes landed — record where. Never overwrites. */
export const attachIssuedPdf = (
  issue: IssuedDocument,
  pdfPath: string,
): Result<IssuedDocument, IssueDomainError> => {
  if (issue.pdfPath !== '') {
    return err(invalidIssue('This issue already has its rendered bytes.'));
  }
  if (pdfPath === '') {
    return err(invalidIssue('A PDF path is required.'));
  }
  return ok({ ...issue, pdfPath });
};

/** Void an issue (optionally superseded by its replacement). Voiding a
 *  voided issue is a mistake, not a no-op — the record must stay honest. */
export const voidIssuedDocument = (
  issue: IssuedDocument,
  supersededBy?: string,
): Result<IssuedDocument, IssueDomainError> => {
  if (issue.status === 'voided') {
    return err(invalidIssue('This issue is already voided.'));
  }
  return ok({
    ...issue,
    status: 'voided',
    ...(supersededBy !== undefined ? { supersededBy } : {}),
  });
};
