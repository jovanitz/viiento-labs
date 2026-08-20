import type {
  Entry,
  EntryField,
  TemplateColor,
  TemplateIcon,
} from '@acme/bison-domain';

/** A timeline entry as the UI (and the RPC edge) sees it — brands erased.
 *  Presentation (day grouping, time labels) belongs to the flow/VM, not
 *  here. */
export type EntryDto = {
  readonly id: string;
  readonly clientId: string;
  readonly templateId: string;
  readonly templateName: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  readonly at: string;
  readonly summary: string;
  readonly fields: readonly EntryField[];
};

export const toEntryDto = (entry: Entry): EntryDto => ({
  id: entry.id,
  clientId: entry.clientId,
  templateId: entry.templateId,
  templateName: entry.templateName,
  icon: entry.icon,
  color: entry.color,
  at: entry.at,
  summary: entry.summary,
  fields: entry.fields,
});
