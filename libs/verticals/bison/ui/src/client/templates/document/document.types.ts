/**
 * ViewModel for a rendered document — the printable artifact a Template can
 * become (ADR-0020). This is the shape the future pure `resolve()` emits:
 * ALREADY PAGINATED and already resolved (tokens replaced, values filled),
 * so the view only renders it. Nothing here is computed in a component.
 *
 * Geometry is in POINTS, never screen pixels — a document's world is the
 * page, and the preview scales points to pixels at the last moment
 * (document.page.tsx). Keeping pt in the VM is what lets the same tree
 * drive preview, print and PDF.
 */

export type PaperKind = 'letter' | 'a4' | 'half-letter';

/** Closed union, not a free string: the PDF adapter has to embed the font,
 *  so only families we ship and may embed can be offered (ADR-0020 §3). */
export type FamilyKey = 'sans' | 'serif' | 'slab';

export type DocumentThemeVM = {
  readonly id: string;
  readonly name: string;
  /** One-line pitch, shown in the theme picker. */
  readonly blurb: string;
  readonly family: FamilyKey;
  /** Body text size in points; every other size derives from it × `scale`. */
  readonly basePt: number;
  readonly scale: number;
  readonly density: 'compact' | 'regular' | 'airy';
  readonly labels: 'above' | 'inline' | 'hidden';
  readonly fieldRule: 'underline' | 'box' | 'none';
  readonly sectionRule: 'line' | 'band' | 'none';
  /** Accent, as a CSS color. The only chromatic decision a business makes. */
  readonly accent: string;
  readonly margins: EdgeInsets;
};

export type EdgeInsets = {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
};

/**
 * One item on a row. Slots in a row share the width evenly — that even
 * split IS the layout model (ADR-0020 §2): the business groups fields into
 * a row, it never types a coordinate.
 *
 * `field` and `token` differ in provenance, not in looks: a field is a
 * captured value, a token is resolved from context (folio, issue date,
 * business identity) so it can never go stale the way typed text does.
 */
export type SlotVM =
  | {
      readonly kind: 'field' | 'token';
      readonly label: string;
      readonly value: string;
      /** Long prose reserves height and wraps; short values sit on one line. */
      readonly multiline?: boolean;
    }
  | { readonly kind: 'static'; readonly text: string }
  | {
      /** A captured file. Images embed on the page; anything else prints
       *  as its name (paper cannot open a PDF). */
      readonly kind: 'file';
      readonly label: string;
      readonly name: string;
      readonly dataUrl?: string | undefined;
      readonly isImage: boolean;
    }
  | {
      readonly kind: 'checklist';
      readonly label: string;
      readonly items: readonly ChecklistItemVM[];
    }
  | {
      readonly kind: 'signature';
      readonly label: string;
      readonly name: string;
    }
  | { readonly kind: 'spacer'; readonly size: 'sm' | 'md' | 'lg' };

export type ChecklistItemVM = {
  readonly text: string;
  readonly checked: boolean;
};

export type RowVM = { readonly slots: readonly SlotVM[] };

export type SectionVM = {
  readonly id: string;
  readonly title?: string;
  readonly rows: readonly RowVM[];
  readonly emphasis?: 'normal' | 'boxed' | 'quiet';
};

/** Header/footer band — repeats on every page. */
export type BandVM = { readonly rows: readonly RowVM[] };

/** The only free-positioned things on the page: assets, never data
 *  (ADR-0020 §2). Anchored to a corner of a region, not to an x/y. */
export type MarkVM = {
  readonly id: string;
  readonly asset: 'logo' | 'signature' | 'seal' | 'qr';
  readonly region: 'header' | 'footer';
  readonly corner: 'left' | 'center' | 'right';
  /** Drawn beneath a signature mark (name, licence). */
  readonly caption?: string;
};

export type DocumentPageVM = {
  readonly sections: readonly SectionVM[];
};

export type DocumentVM = {
  readonly title: string;
  readonly paper: PaperKind;
  readonly theme: DocumentThemeVM;
  readonly header?: BandVM;
  readonly footer?: BandVM;
  readonly marks: readonly MarkVM[];
  /** Pagination happened upstream — the view never decides where a page
   *  breaks, it only draws the pages it was handed. */
  readonly pages: readonly DocumentPageVM[];
};

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
