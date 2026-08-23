import { describe, expect, it } from 'vitest';
import type { DocumentFormat, DocumentFormatId } from '@acme/bison-domain';
import type { BisonAccountStore } from '../persistence/in-memory-bison-store';

/** Contract for the document-formats repository — every adapter must
 *  satisfy it. `makeStore` must return a FRESH, EMPTY account world. */
const NOW = '2026-08-20T12:00:00.000Z';

const format = (over: Partial<DocumentFormat> = {}): DocumentFormat => ({
  id: crypto.randomUUID() as DocumentFormatId,
  name: 'Receta',
  themeId: 'clinical',
  paper: 'letter',
  headerTokens: ['business.name', 'business.phone'],
  footerTokens: ['document.folio'],
  marks: [{ id: 'logo', asset: 'logo', region: 'header', corner: 'left' }],
  createdAt: NOW,
  updatedAt: NOW,
  ...over,
});

export const bisonFormatsContract = (
  name: string,
  makeStore: () => BisonAccountStore | Promise<BisonAccountStore>,
): void => {
  describe(`DocumentFormatRepository contract: ${name}`, () => {
    it('round-trips a format, provenance included', async () => {
      const store = await makeStore();
      const saved = format({ shippedKey: 'fmt-prescription' });
      await store.formats.save(saved);
      expect(await store.formats.findById(saved.id)).toEqual(saved);
    });

    it('keeps an absent provenance absent', async () => {
      const store = await makeStore();
      const saved = format();
      await store.formats.save(saved);
      const found = await store.formats.findById(saved.id);
      expect(found?.shippedKey).toBeUndefined();
    });

    it('upserts on save and lists in creation order', async () => {
      const store = await makeStore();
      const first = format({ name: 'Primero' });
      const second = format({
        name: 'Segundo',
        createdAt: '2026-08-21T12:00:00.000Z',
        updatedAt: '2026-08-21T12:00:00.000Z',
      });
      await store.formats.save(first);
      await store.formats.save(second);
      await store.formats.save({ ...first, paper: 'a4' });

      const listed = await store.formats.list();
      expect(listed.map((f) => f.name)).toEqual(['Primero', 'Segundo']);
      expect(listed[0]?.paper).toBe('a4');
    });
  });
};
