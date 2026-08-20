import { describe, expect, it } from 'vitest';
import { createTemplate, makeTemplateId } from '../templates/template';
import type { Template } from '../templates/template';
import { makeClientId } from '../clients/client';
import type { ClientId } from '../clients/client';
import { deriveSummary, fillEntry, makeEntryId } from './entry';
import type { EntryId } from './entry';
import { encodeFileRef } from './file-ref';

const NOW = '2026-08-19T12:00:00.000Z';

const template = (): Template => {
  const id = makeTemplateId('tpl-1');
  if (!id.ok) throw new Error('fixture id must be valid');
  const made = createTemplate({
    id: id.value,
    name: 'Consulta',
    description: '',
    icon: 'stethoscope',
    color: 'teal',
    blocks: [
      { id: 'sec', kind: 'section', label: 'Datos', width: 'full' },
      {
        id: 'motivo',
        kind: 'short-text',
        label: 'Motivo',
        required: true,
        width: 'full',
      },
      {
        id: 'via',
        kind: 'radio',
        label: 'Vía',
        options: ['Oral', 'Tópica'],
        width: 'half',
      },
      { id: 'notas', kind: 'long-text', label: 'Notas', width: 'full' },
      { id: 'estudio', kind: 'file', label: 'Estudio', width: 'half' },
    ],
    occurredAt: NOW,
  });
  if (!made.ok) throw new Error('fixture template must be valid');
  return made.value;
};

const entryId = (): EntryId => {
  const made = makeEntryId('ent-1');
  if (!made.ok) throw new Error('fixture id must be valid');
  return made.value;
};

const clientId = (): ClientId => {
  const made = makeClientId('cli-1');
  if (!made.ok) throw new Error('fixture id must be valid');
  return made.value;
};

const fill = (values: Readonly<Record<string, string>>) =>
  fillEntry(template(), {
    id: entryId(),
    clientId: clientId(),
    values,
    occurredAt: NOW,
  });

describe('fillEntry', () => {
  it('derives self-contained fields in capture order, skipping empties', () => {
    const result = fill({
      motivo: '  Dolor de cabeza ',
      via: 'Oral',
      notas: '',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.fields).toEqual([
      { blockId: 'motivo', label: 'Motivo', value: 'Dolor de cabeza' },
      { blockId: 'via', label: 'Vía', value: 'Oral' },
    ]);
    expect(result.value.templateName).toBe('Consulta');
    expect(result.value.icon).toBe('stethoscope');
    expect(result.value.color).toBe('teal');
    expect(result.value.summary).toBe('Dolor de cabeza');
    expect(result.value.at).toBe(NOW);
  });

  it('reports every problem of the fill in one error', () => {
    const result = fill({
      via: 'Inyectada',
      fantasma: 'x',
      sec: 'una sección no captura',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.tag).toBe('domain/invalid-entry-values');
    expect(result.error.details).toEqual({
      unknown: ['fantasma', 'sec'],
      missing: ['motivo'],
      invalidChoice: ['via'],
    });
  });

  it('treats a required value of only spaces as missing', () => {
    const result = fill({ motivo: '   ' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.details).toMatchObject({ missing: ['motivo'] });
  });
});

describe('deriveSummary', () => {
  it('is empty for an entry with no captured values', () => {
    expect(deriveSummary([])).toBe('');
  });

  it('shows a file field by its file name', () => {
    const value = encodeFileRef({
      name: 'radiografia.png',
      mime: 'image/png',
      size: 1,
      storagePath: 'clients/cli-1/file-1',
    });
    expect(
      deriveSummary([{ blockId: 'estudio', label: 'Estudio', value }]),
    ).toBe('radiografia.png');
  });

  it('truncates long values with an ellipsis', () => {
    const value = 'x'.repeat(120);
    const summary = deriveSummary([
      { blockId: 'notas', label: 'Notas', value },
    ]);
    expect(summary).toHaveLength(80);
    expect(summary.endsWith('…')).toBe(true);
  });
});
