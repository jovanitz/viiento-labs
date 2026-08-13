/**
 * Seed Timeline entries — fixture VALUES filled from the account's
 * Templates (client/templates/templates.fixtures.ts), not the templates
 * themselves. `entryFromFilledValues`/`withFilledValues` are the live
 * counterparts: attaching a template creates a blank entry (empty values),
 * and editing it inline (timeline.entry.tsx's Edit button) re-derives
 * fields/summary the same way — see timeline.fill.logic.ts.
 */
import { TEMPLATES } from '../../../templates/templates.fixtures';
import type { EntryTemplate } from '../../../templates/templates.types';
import type { EntryField, TimelineEntry } from './timeline.types';
import { fieldsFrom, summaryFrom } from './timeline.fill.logic';
import type { FillValues } from './timeline.fill.logic';

const templateById = (id: string) =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;

const FIELDS_BY_TEMPLATE: Record<string, readonly EntryField[]> = {
  'tpl-note': [
    { label: 'Note', value: 'Client asked for a shorter fade next time.' },
  ],
  'tpl-nom004': [
    { label: 'Motivo de consulta', value: 'Irritación leve tras afeitado' },
    { label: 'Diagnóstico', value: 'Foliculitis superficial' },
    {
      label: 'Tratamiento indicado',
      value: 'Loción calmante, evitar afeitado 5 días',
    },
    { label: 'Responsable', value: 'Marco Vega' },
  ],
  'tpl-consent': [
    { label: 'Procedimiento', value: 'Coloración capilar' },
    { label: 'Firmado por', value: 'Cliente' },
    { label: 'Fecha de firma', value: 'Al momento de adjuntar' },
  ],
  'tpl-followup': [
    { label: 'Próximo contacto', value: 'En 2 semanas' },
    { label: 'Canal', value: 'WhatsApp' },
  ],
};

const SUMMARY_BY_TEMPLATE: Record<string, string> = {
  'tpl-note': 'Client asked for a shorter fade next time.',
  'tpl-nom004': 'Foliculitis superficial — loción calmante indicada.',
  'tpl-consent': 'Coloración capilar — consentimiento firmado.',
  'tpl-followup': 'Seguimiento programado en 2 semanas.',
};

const timeLabel = (at: Date) =>
  at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export const newEntryFromTemplate = (
  template: EntryTemplate,
  id: string,
  at: Date,
): TimelineEntry => ({
  id,
  templateId: template.id,
  templateName: template.name,
  icon: template.icon,
  at,
  timeLabel: timeLabel(at),
  summary: SUMMARY_BY_TEMPLATE[template.id] ?? template.description,
  fields: FIELDS_BY_TEMPLATE[template.id] ?? [],
});

/** The live counterpart of `newEntryFromTemplate` — builds an entry from
 *  a values map (blank when a template is first attached). */
export const entryFromFilledValues = (
  template: EntryTemplate,
  values: FillValues,
  id: string,
  at: Date,
): TimelineEntry => ({
  id,
  templateId: template.id,
  templateName: template.name,
  icon: template.icon,
  at,
  timeLabel: timeLabel(at),
  summary: summaryFrom(template.blocks, values),
  fields: fieldsFrom(template.blocks, values),
});

/** Re-derives an existing entry's fields/summary after inline editing —
 *  identity + timestamp stay put, only the captured content changes. */
export const withFilledValues = (
  entry: TimelineEntry,
  template: EntryTemplate,
  values: FillValues,
): TimelineEntry => ({
  ...entry,
  summary: summaryFrom(template.blocks, values),
  fields: fieldsFrom(template.blocks, values),
});

const seed = (templateId: string, isoDate: string): TimelineEntry =>
  newEntryFromTemplate(
    templateById(templateId),
    `seed-${templateId}-${isoDate}`,
    new Date(isoDate),
  );

export const SEED_ENTRIES: readonly TimelineEntry[] = [
  seed('tpl-note', '2026-07-20T10:15:00'),
  seed('tpl-nom004', '2026-08-03T09:30:00'),
  seed('tpl-consent', '2026-08-03T09:45:00'),
];
