import type {
  DocumentFormat,
  DocumentFormatId,
  IssuedDocument,
  IssuedDocumentId,
} from '@acme/bison-domain';

/** Repository port for the account's document formats (ADR-0021). `list`
 *  returns them in creation order — the UI merges them over the shipped
 *  catalog by `shippedKey`. */
export type DocumentFormatRepository = {
  readonly findById: (id: DocumentFormatId) => Promise<DocumentFormat | null>;
  readonly list: () => Promise<ReadonlyArray<DocumentFormat>>;
  readonly save: (format: DocumentFormat) => Promise<void>;
};

/** Issued documents are append-only (ADR-0020 §7): save inserts or
 *  replaces the SAME id (attach-pdf / void transitions), never deletes. */
export type IssuedDocumentRepository = {
  readonly findById: (id: IssuedDocumentId) => Promise<IssuedDocument | null>;
  readonly listByEntry: (
    entryId: string,
  ) => Promise<ReadonlyArray<IssuedDocument>>;
  readonly save: (issue: IssuedDocument) => Promise<void>;
};

/**
 * The account's folio sequence — allocation must be atomic and monotonic;
 * a granted number is CONSUMED even if the issue later fails to upload
 * its bytes (gaps are auditable, collisions are not). Device-reserved
 * blocks (ADR-0020 §7) arrive with the offline-writes arc; while issuing
 * is online-only, the server-side sequence is the whole story.
 */
export type FolioSource = {
  readonly next: () => Promise<number>;
};
