import { describe, expect, it } from 'vitest';
import {
  createDocumentFormat,
  makeDocumentFormatId,
  updateDocumentFormat,
} from './format';
import type { DocumentFormat, DocumentFormatId } from './format';

const NOW = '2026-08-20T12:00:00.000Z';

const id = (): DocumentFormatId => {
  const made = makeDocumentFormatId('fmt-1');
  if (!made.ok) throw new Error('fixture id must be valid');
  return made.value;
};

const create = (
  over: Partial<Parameters<typeof createDocumentFormat>[0]> = {},
) =>
  createDocumentFormat({
    id: id(),
    name: 'Receta',
    themeId: 'clinical',
    paper: 'letter',
    headerTokens: ['business.name', 'business.phone'],
    footerTokens: ['document.folio'],
    marks: [{ id: 'logo', asset: 'logo', region: 'header', corner: 'left' }],
    occurredAt: NOW,
    ...over,
  });

const existing = (): DocumentFormat => {
  const made = create();
  if (!made.ok) throw new Error('fixture format must be valid');
  return made.value;
};

describe('createDocumentFormat', () => {
  it('creates a format, keeping shipped provenance when given', () => {
    const result = create({ shippedKey: 'fmt-prescription' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.shippedKey).toBe('fmt-prescription');
    expect(result.value.name).toBe('Receta');
  });

  it('collects every problem in one error', () => {
    const result = create({
      name: ' ',
      themeId: '',
      headerTokens: ['business.name', 'business.name'],
      marks: [
        { id: 'a', asset: 'logo', region: 'header', corner: 'left' },
        { id: 'b', asset: 'logo', region: 'footer', corner: 'right' },
      ],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.tag).toBe('domain/invalid-format');
    expect(
      (result.error.details as { problems: string[] }).problems,
    ).toHaveLength(4);
  });
});

describe('updateDocumentFormat', () => {
  it('applies changes, validates them, and bumps updatedAt', () => {
    const later = '2026-08-21T09:00:00.000Z';
    const result = updateDocumentFormat(
      existing(),
      { paper: 'half-letter', footerTokens: [] },
      later,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.paper).toBe('half-letter');
    expect(result.value.footerTokens).toEqual([]);
    expect(result.value.updatedAt).toBe(later);

    const invalid = updateDocumentFormat(existing(), { name: ' ' }, later);
    expect(invalid.ok).toBe(false);
  });
});
