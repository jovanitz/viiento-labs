/**
 * Fixture Templates — the account's template library. Deliberately mixes a
 * freeform note, a regulated clinical-record example (NOM-004, Mexico's
 * clinical-record standard — the example Josh gave for "not a rigid form"),
 * a consent with a signature, and one custom template the business made
 * itself, so the block shapes visibly differ across the gallery.
 */
import type { EntryTemplate } from './templates.types';

export const TEMPLATES: readonly EntryTemplate[] = [
  {
    id: 'tpl-note',
    name: 'Visit note',
    description: 'A quick freeform note about the visit.',
    icon: 'file-text',
    kind: 'default',
    blocks: [
      {
        id: 'note-body',
        kind: 'long-text',
        label: 'Note',
        required: true,
        width: 'full',
      },
    ],
  },
  {
    id: 'tpl-nom004',
    name: 'Clinical record · NOM-004',
    description: "Structured record per Mexico's clinical-record standard.",
    icon: 'stethoscope',
    kind: 'default',
    blocks: [
      {
        id: 'nom004-consulta',
        kind: 'section',
        label: 'Consulta',
        width: 'full',
      },
      {
        id: 'nom004-motivo',
        kind: 'short-text',
        label: 'Motivo de consulta',
        required: true,
        width: 'full',
      },
      {
        id: 'nom004-diagnostico',
        kind: 'short-text',
        label: 'Diagnóstico',
        required: true,
        width: 'full',
      },
      {
        id: 'nom004-tratamiento',
        kind: 'long-text',
        label: 'Tratamiento indicado',
        required: true,
        width: 'full',
      },
      {
        id: 'nom004-responsable-section',
        kind: 'section',
        label: 'Responsable',
        width: 'full',
      },
      {
        id: 'nom004-responsable',
        kind: 'short-text',
        label: 'Responsable',
        required: true,
        width: 'full',
      },
    ],
  },
  {
    id: 'tpl-consent',
    name: 'Signed consent',
    description: 'Confirms the client signed off on a procedure.',
    icon: 'shield-check',
    kind: 'default',
    blocks: [
      {
        id: 'consent-procedimiento',
        kind: 'short-text',
        label: 'Procedimiento',
        required: true,
        width: 'full',
      },
      {
        id: 'consent-firmado-por',
        kind: 'select',
        label: 'Firmado por',
        required: true,
        width: 'half',
        options: ['Cliente', 'Tutor/a'],
      },
      {
        id: 'consent-fecha',
        kind: 'date',
        label: 'Fecha de firma',
        required: true,
        width: 'half',
      },
      {
        id: 'consent-firma',
        kind: 'signature',
        label: 'Firma',
        required: true,
        width: 'full',
      },
    ],
  },
  {
    id: 'tpl-followup',
    name: 'Follow-up plan',
    description: "Marco's own template for check-ins between visits.",
    icon: 'sparkles',
    kind: 'custom',
    blocks: [
      {
        id: 'followup-proximo-contacto',
        kind: 'select',
        label: 'Próximo contacto',
        required: true,
        width: 'half',
        options: ['1 semana', '2 semanas', '1 mes'],
      },
      {
        id: 'followup-canal',
        kind: 'select',
        label: 'Canal',
        required: true,
        width: 'half',
        options: ['WhatsApp', 'Llamada', 'Email'],
      },
    ],
  },
];
