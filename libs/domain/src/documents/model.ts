/**
 * The document engine's model (ADR-0020 §8, ADR-0021) — a printable
 * artifact as data. Geometry is in POINTS: a document's world is the page.
 * Screen pixels exist only in the ui preview; PDF bytes only in the
 * infrastructure adapter. Both consume THIS tree, which is what makes
 * preview and file agree by construction.
 *
 * The engine is `vertical:core`: nothing bison-specific (or any vertical's)
 * may enter it — templates derive their body BEFORE this model exists.
 */

export type PaperKind = 'letter' | 'a4' | 'half-letter';

/** Closed union, not a free string: the PDF adapter must embed the font,
 *  so only families we ship and are licensed to embed can be offered. */
export type FamilyKey = 'sans' | 'serif' | 'slab';

export type EdgeInsets = {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
};

export type DocumentTheme = {
  readonly id: string;
  readonly name: string;
  /** One-line pitch, shown in the theme picker. */
  readonly blurb: string;
  readonly family: FamilyKey;
  /** Body text size in points; every other size derives from it × scale. */
  readonly basePt: number;
  readonly scale: number;
  readonly density: 'compact' | 'regular' | 'airy';
  readonly labels: 'above' | 'inline' | 'hidden';
  readonly fieldRule: 'underline' | 'box' | 'none';
  readonly sectionRule: 'line' | 'band' | 'none';
  /** The only chromatic decision a business makes. */
  readonly accent: string;
  readonly margins: EdgeInsets;
};

/** Point size of each paper, portrait. */
export const PAPER_PT: Record<
  PaperKind,
  { readonly w: number; readonly h: number }
> = {
  letter: { w: 612, h: 792 },
  a4: { w: 595, h: 842 },
  'half-letter': { w: 396, h: 612 },
};

/** Vertical rhythm in points, by density — one scale, applied everywhere. */
export const RHYTHM: Record<DocumentTheme['density'], number> = {
  compact: 7,
  regular: 11,
  airy: 17,
};

/** Paper is paper: near-black ink on white, whatever theme the app is in. */
export const DOC_INK = '#1c1c1c';
export const DOC_INK_MUTED = '#6b6b6b';
export const DOC_HAIRLINE = '#d9d9d9';

export type ChecklistItem = {
  readonly text: string;
  readonly checked: boolean;
};

/** One item on a row. Slots share the row's width evenly — that even split
 *  IS the layout model: the business groups fields, never types an x/y. */
export type DocumentSlot =
  | {
      readonly kind: 'field' | 'token';
      readonly label: string;
      readonly value: string;
      readonly multiline?: boolean;
    }
  | { readonly kind: 'static'; readonly text: string }
  | {
      readonly kind: 'file';
      readonly label: string;
      readonly name: string;
      readonly dataUrl?: string | undefined;
      readonly isImage: boolean;
    }
  | {
      readonly kind: 'checklist';
      readonly label: string;
      readonly items: readonly ChecklistItem[];
    }
  | {
      readonly kind: 'signature';
      readonly label: string;
      readonly name: string;
    }
  | { readonly kind: 'spacer'; readonly size: 'sm' | 'md' | 'lg' };

export type DocumentRow = { readonly slots: readonly DocumentSlot[] };

export type DocumentSection = {
  readonly id: string;
  readonly title?: string;
  readonly rows: readonly DocumentRow[];
  readonly emphasis?: 'normal' | 'boxed' | 'quiet';
};

/** Header/footer band — repeats on every page. */
export type DocumentBand = { readonly rows: readonly DocumentRow[] };

/** The only free-positioned things on a page, and never data: assets,
 *  anchored to a region corner. */
export type DocumentMark = {
  readonly id: string;
  readonly asset: 'logo' | 'signature' | 'seal' | 'qr';
  readonly region: 'header' | 'footer';
  readonly corner: 'left' | 'center' | 'right';
  readonly caption?: string;
};

/** The composed document BEFORE pagination: one flowing body. */
export type DocumentModel = {
  readonly title: string;
  readonly paper: PaperKind;
  readonly theme: DocumentTheme;
  readonly header?: DocumentBand;
  readonly footer?: DocumentBand;
  readonly marks: readonly DocumentMark[];
  readonly sections: readonly DocumentSection[];
};

export type DocumentPage = { readonly sections: readonly DocumentSection[] };

/** The paginated tree every consumer draws — pages are decided HERE, never
 *  by a view or an adapter. */
export type PaginatedDocument = {
  readonly title: string;
  readonly paper: PaperKind;
  readonly theme: DocumentTheme;
  readonly header?: DocumentBand;
  readonly footer?: DocumentBand;
  readonly marks: readonly DocumentMark[];
  readonly pages: readonly DocumentPage[];
};
