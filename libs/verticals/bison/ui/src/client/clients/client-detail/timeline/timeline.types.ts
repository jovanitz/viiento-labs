/**
 * ViewModel for the client Timeline — the running record attached to a
 * client's individual page. Entries come from Templates (see
 * client/templates/ — the account-level template library); each entry's
 * captured content is a flexible list of label/value pairs rather than a
 * fixed schema, because a quick note and a NOM-004 clinical record don't
 * share a shape.
 */
import type {
  EntryTemplate,
  TemplateIcon,
  TemplateKind,
} from '../../../templates/templates.types';

export type { EntryTemplate, TemplateIcon, TemplateKind };

/** One captured value on a logged entry — NOT the block/field schema (see
 *  `TemplateBlock` in client/templates/templates.types.ts), just what got
 *  filled in. */
export type EntryField = {
  readonly label: string;
  readonly value: string;
};

export type TimelineEntry = {
  readonly id: string;
  readonly templateId: string;
  readonly templateName: string;
  readonly icon: TemplateIcon;
  readonly at: Date;
  /** Preformatted — e.g. "9:30 AM". */
  readonly timeLabel: string;
  /** One-line excerpt for the card; the full picture is `fields`. */
  readonly summary: string;
  readonly fields: readonly EntryField[];
};

export type TimelineDay = {
  /** Preformatted — e.g. "Monday, August 3". */
  readonly dateLabel: string;
  /** Newest first. */
  readonly entries: readonly TimelineEntry[];
};

export type TimelineVM = {
  /** Newest day first. */
  readonly days: readonly TimelineDay[];
  readonly templates: readonly EntryTemplate[];
  readonly empty: boolean;
};
