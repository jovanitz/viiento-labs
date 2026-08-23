/**
 * ViewModel for a rendered document — since the engine moved to the core
 * domain (ADR-0020 §9) these are ALIASES over its model, bridged through
 * `@acme/application` (ui never imports domain). The names keep their
 * `*VM` suffix so the frozen views read as before; the shapes are the
 * engine's own, which is what guarantees preview and PDF draw one tree.
 *
 * Geometry is in POINTS, never screen pixels — the preview scales points
 * to pixels at the last moment (document.page.tsx).
 */
import type {
  ChecklistItem,
  DocumentBand,
  DocumentMark,
  DocumentPage,
  DocumentRow,
  DocumentSection,
  DocumentSlot,
  DocumentTheme,
  PaginatedDocument,
} from '@acme/application';

export type { EdgeInsets, FamilyKey, PaperKind } from '@acme/application';

export type DocumentThemeVM = DocumentTheme;
export type SlotVM = DocumentSlot;
export type ChecklistItemVM = ChecklistItem;
export type RowVM = DocumentRow;
export type SectionVM = DocumentSection;
export type BandVM = DocumentBand;
export type MarkVM = DocumentMark;
export type DocumentPageVM = DocumentPage;

/** The paginated tree every consumer draws — pages are decided by the
 *  engine, never by a view. */
export type DocumentVM = PaginatedDocument;

/** Why this template cannot be issued yet — the `canIssue` result, as data
 *  the view renders (ADR-0020 §6). */
export type IssueBlockerVM = {
  readonly id: string;
  readonly message: string;
};

export type DocumentPreviewVM = {
  readonly document: DocumentVM;
  readonly blockers: readonly IssueBlockerVM[];
  /**
   * Present only in a layout/format preview, where the page shows sample
   * values. A document composed from a real Timeline entry has no sample —
   * it is that entry, and nothing about it is switchable.
   */
  readonly sample?: 'typical' | 'stress' | undefined;
};
