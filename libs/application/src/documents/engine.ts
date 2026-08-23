/**
 * The document engine's surface, re-exported for the UI. The engine lives
 * in `domain` (ADR-0020 §9) and `ui` may not import domain directly —
 * this application module is the sanctioned bridge, the same way flows
 * re-export the domain types their ViewModels carry.
 */
export {
  DOC_HAIRLINE,
  DOC_INK,
  DOC_INK_MUTED,
  PAPER_PT,
  RHYTHM,
  paginateDocument,
  documentPrims,
  wrapText,
} from '@acme/domain';
export type {
  ChecklistItem,
  DocPrim,
  DocumentBand,
  DocumentMark,
  DocumentModel,
  DocumentPage,
  DocumentRow,
  DocumentSection,
  DocumentSlot,
  DocumentTheme,
  EdgeInsets,
  FamilyKey,
  PaginatedDocument,
  PaperKind,
  TextMeasure,
  TextStyle,
} from '@acme/domain';
