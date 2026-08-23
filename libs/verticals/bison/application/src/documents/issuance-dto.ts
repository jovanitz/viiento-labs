import { defineError } from '@acme/shared';
import type { TaggedError } from '@acme/shared';
import { folioLabel } from '@acme/bison-domain';
import type {
  DocumentToken,
  IssueDomainError,
  IssuedDocument,
} from '@acme/bison-domain';

export const issueNotFound = defineError('app/issue-not-found');
export const issueTargetNotFound = defineError('app/issue-target-not-found');

export type IssuanceError =
  | IssueDomainError
  | TaggedError<'app/issue-not-found'>
  | TaggedError<'app/issue-target-not-found'>
  | TaggedError<'app/file-storage-failed'>;

export type IssueDto = {
  readonly id: string;
  readonly folio: number;
  readonly folioLabel: string;
  readonly issuedAt: string;
  readonly status: IssuedDocument['status'];
  readonly pdfPath: string;
  /** Fully resolved token values, folio and date included — exactly what
   *  the renderer composes with. */
  readonly tokens: Readonly<Partial<Record<DocumentToken, string>>>;
};

export const toIssueDto = (issue: IssuedDocument): IssueDto => ({
  id: issue.id,
  folio: issue.folio,
  folioLabel: folioLabel(issue.folio),
  issuedAt: issue.issuedAt,
  status: issue.status,
  pdfPath: issue.pdfPath,
  tokens: issue.snapshot.tokens,
});

export const definedTokens = (
  pairs: ReadonlyArray<readonly [DocumentToken, string | undefined]>,
): Partial<Record<DocumentToken, string>> =>
  Object.fromEntries(
    pairs.filter((pair): pair is readonly [DocumentToken, string] =>
      Boolean(pair[1]),
    ),
  );

export const issueDateLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
