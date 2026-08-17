/**
 * Templates — account-level, reusable across every client. A Template is an
 * identity (name/description/icon) plus an ordered schema of Blocks: the
 * flexible-form definition an entry attaches to the Timeline. Default
 * templates ship with the account and aren't editable; custom ones the
 * business builds itself in the Template Builder (templates.builder.view).
 *
 * `blocks` is the CAPTURE schema (what the builder edits, what a future
 * fill-in form would render). It is deliberately separate from how a filled
 * entry's values are printed — printing a document like a prescription
 * needs its own layout, not just this field list (see
 * client-detail/timeline/timeline.types.ts for the captured VALUE shape,
 * `EntryField`).
 */

export type TemplateKind = 'default' | 'custom';

/** Icon key for the Template itself, resolved to a lucide-react glyph by
 *  templates.icons — VMs stay framework-agnostic. */
export type TemplateIcon =
  | 'file-text'
  | 'stethoscope'
  | 'shield-check'
  | 'sparkles';

/**
 * Every block kind the Template Builder's palette offers. Data-capturing
 * kinds (short-text … signature) become a field in a filled entry;
 * structural kinds (section, help-text) only organize the form and never
 * produce a value.
 */
export type FieldKind =
  | 'short-text'
  | 'long-text'
  | 'number'
  | 'radio'
  | 'select'
  | 'checkboxes'
  | 'switch'
  | 'date'
  | 'time'
  | 'file'
  | 'signature'
  | 'section'
  | 'help-text';

/** Structural kinds never require a value or carry choice options. */
export const STRUCTURAL_KINDS: readonly FieldKind[] = ['section', 'help-text'];

/** Kinds that offer a set of choices the author defines. */
export const CHOICE_KINDS: readonly FieldKind[] = [
  'radio',
  'select',
  'checkboxes',
];

/** Full width stacks the block; half lets two sit side by side (e.g. a
 *  prescription's Age next to Weight) — the same hint both the inline
 *  timeline render and the future print layout read. */
export type FieldWidth = 'full' | 'half';

export type TemplateBlock = {
  readonly id: string;
  readonly kind: FieldKind;
  /** The field's label — or, for `section`/`help-text`, the heading/body
   *  text itself. */
  readonly label: string;
  readonly required?: boolean;
  readonly width: FieldWidth;
  /** Choices for radio/select/checkboxes. */
  readonly options?: readonly string[];
};

/** Where a placed print element gets its content: a specific capture
 *  block's value ('field'), or a literal string the designer typed
 *  ('text' — a title, the business name, a date placeholder). */
export type PrintElementKind = 'field' | 'text';

/** One item positioned freely on the printed page (raw px within the
 *  designer's fixed-size canvas — see templates.print.logic.ts). Free x/y
 *  is the whole point of a print layout over the capture schema's linear
 *  `blocks` list: a prescription needs Age next to Weight, a signature at
 *  the bottom, not everything stacked top to bottom. */
export type PrintElement = {
  readonly id: string;
  readonly kind: PrintElementKind;
  /** Set when `kind: 'field'` — the TemplateBlock whose value renders here. */
  readonly blockId?: string | undefined;
  /** The field's label (kind 'field') or the literal text (kind 'text'). */
  readonly content: string;
  readonly x: number;
  readonly y: number;
};

export type PrintLayout = {
  readonly elements: readonly PrintElement[];
};

export type EntryTemplate = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: TemplateIcon;
  readonly kind: TemplateKind;
  /** The capture schema. Every fixture template has one so the gallery can
   *  show a real field count; only `kind: 'custom'` ones are editable. */
  readonly blocks: readonly TemplateBlock[];
  /** How a filled entry prints — undefined until the business designs one
   *  in the Print layout screen (templates/print/). */
  readonly printLayout?: PrintLayout;
};
