import { describe, expect, it } from 'vitest';
import { fixedClock, noopLogger, sequentialIdGenerator } from '@acme/shared';
import type { DocumentFormat } from '@acme/bison-domain';
import type { DocumentFormatRepository } from './ports';
import { makeFormatUseCases } from './use-cases';

const inMemoryFormats = (): DocumentFormatRepository => {
  const store = new Map<string, DocumentFormat>();
  return {
    findById: async (id) => store.get(id) ?? null,
    list: async () => [...store.values()],
    save: async (format) => {
      store.set(format.id, format);
    },
  };
};

const useCases = () =>
  makeFormatUseCases({
    formats: inMemoryFormats(),
    clock: fixedClock(new Date('2026-08-20T12:00:00.000Z')),
    ids: sequentialIdGenerator('fmt'),
    logger: noopLogger,
  });

const base = {
  name: 'Receta',
  themeId: 'clinical',
  paper: 'letter' as const,
  headerTokens: ['business.name' as const],
  footerTokens: [],
  marks: [],
};

describe('Format use cases', () => {
  it('creates with shipped provenance, then updates in place', async () => {
    const formats = useCases();
    const created = await formats.save({
      ...base,
      shippedKey: 'fmt-prescription',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.shippedKey).toBe('fmt-prescription');

    const updated = await formats.save({
      ...base,
      existingId: created.value.id,
      paper: 'half-letter',
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.id).toBe(created.value.id);
    expect(updated.value.paper).toBe('half-letter');
    expect(updated.value.shippedKey).toBe('fmt-prescription');

    const listed = await formats.list();
    expect(listed).toHaveLength(1);
  });

  it('propagates validation and reports a missing row', async () => {
    const formats = useCases();
    const invalid = await formats.save({ ...base, name: ' ' });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error.tag).toBe('domain/invalid-format');

    const missing = await formats.save({ ...base, existingId: 'nope' });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.tag).toBe('app/format-not-found');
  });
});
