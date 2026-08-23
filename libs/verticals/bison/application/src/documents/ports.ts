import type { DocumentFormat, DocumentFormatId } from '@acme/bison-domain';

/** Repository port for the account's document formats (ADR-0021). `list`
 *  returns them in creation order — the UI merges them over the shipped
 *  catalog by `shippedKey`. */
export type DocumentFormatRepository = {
  readonly findById: (id: DocumentFormatId) => Promise<DocumentFormat | null>;
  readonly list: () => Promise<ReadonlyArray<DocumentFormat>>;
  readonly save: (format: DocumentFormat) => Promise<void>;
};
