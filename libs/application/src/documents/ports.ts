import type { Result, TaggedError } from '@acme/shared';
import { defineError } from '@acme/shared';
import type { PaginatedDocument } from '@acme/domain';

/**
 * Turning the paginated tree into bytes is a PORT (ADR-0020 §8): the
 * contract is PDF bytes, not a print dialog — a document that leaves the
 * business must be attachable, sendable and archivable. First adapter is
 * client-side (pdf-lib) because issuance must work offline (ADR-0007); a
 * server-side adapter can replace the wiring without touching this type.
 */
export const documentRenderFailed = defineError('app/pdf-render-failed');

export type DocumentRenderError = TaggedError<'app/pdf-render-failed'>;

export type DocumentRenderer = {
  readonly toPdf: (
    doc: PaginatedDocument,
  ) => Promise<Result<Uint8Array, DocumentRenderError>>;
};
