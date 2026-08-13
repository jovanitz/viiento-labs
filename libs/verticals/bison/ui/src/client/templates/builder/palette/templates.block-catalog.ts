/**
 * The Builder palette's catalog — every block kind, grouped and described.
 * Data only. Order here is the order chips render in each palette group.
 */
import type { FieldKind } from '../../templates.types';

export type BlockGroup = 'Text' | 'Choice' | 'Date' | 'Files' | 'Structure';

export const BLOCK_GROUPS: readonly BlockGroup[] = [
  'Text',
  'Choice',
  'Date',
  'Files',
  'Structure',
];

export type BlockCatalogEntry = {
  readonly kind: FieldKind;
  readonly group: BlockGroup;
  readonly label: string;
  readonly description: string;
};

export const BLOCK_CATALOG: readonly BlockCatalogEntry[] = [
  {
    kind: 'short-text',
    group: 'Text',
    label: 'Short text',
    description: 'A single line — name, title…',
  },
  {
    kind: 'long-text',
    group: 'Text',
    label: 'Long text',
    description: 'A paragraph — notes, instructions…',
  },
  {
    kind: 'number',
    group: 'Text',
    label: 'Number',
    description: 'Dose, quantity, age…',
  },
  {
    kind: 'radio',
    group: 'Choice',
    label: 'Single choice',
    description: 'A few visible options, pick one.',
  },
  {
    kind: 'select',
    group: 'Choice',
    label: 'Dropdown',
    description: 'Many options in a list.',
  },
  {
    kind: 'checkboxes',
    group: 'Choice',
    label: 'Multiple choice',
    description: 'Pick any number of options.',
  },
  {
    kind: 'switch',
    group: 'Choice',
    label: 'Yes / No',
    description: 'A single on/off toggle.',
  },
  {
    kind: 'date',
    group: 'Date',
    label: 'Date',
    description: 'A calendar date.',
  },
  { kind: 'time', group: 'Date', label: 'Time', description: 'A time of day.' },
  {
    kind: 'file',
    group: 'Files',
    label: 'File',
    description: 'Upload a document.',
  },
  {
    kind: 'signature',
    group: 'Files',
    label: 'Signature',
    description: 'Captured on screen.',
  },
  {
    kind: 'section',
    group: 'Structure',
    label: 'Section',
    description: 'Groups the fields below it.',
  },
  {
    kind: 'help-text',
    group: 'Structure',
    label: 'Help text',
    description: 'A static note between fields.',
  },
];
