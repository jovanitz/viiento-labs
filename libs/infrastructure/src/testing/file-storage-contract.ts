import { describe, expect, it } from 'vitest';
import type { FileStorage } from '@acme/application';

/**
 * Contract test for the `FileStorage` port: every adapter (in-memory,
 * Supabase Storage) must satisfy it, so they are genuinely interchangeable.
 * `makeStorage` must return a fresh, empty storage each call. Not exported
 * from any barrel — it imports vitest; specs import it relatively.
 */
export const fileStorageContract = (
  name: string,
  makeStorage: () => FileStorage | Promise<FileStorage>,
): void => {
  describe(`FileStorage contract: ${name}`, () => {
    const bytes = new Uint8Array([1, 2, 3]);

    it('stores bytes and signs a URL for them', async () => {
      const storage = await makeStorage();
      const put = await storage.put({ path: 'a/b', bytes, mime: 'image/png' });
      expect(put.ok).toBe(true);

      const signed = await storage.getSignedUrl({
        path: 'a/b',
        expiresInSeconds: 60,
      });
      expect(signed.ok).toBe(true);
      if (signed.ok) expect(signed.value.length).toBeGreaterThan(0);
    });

    it('fails to sign a path that holds no object', async () => {
      const storage = await makeStorage();
      const signed = await storage.getSignedUrl({
        path: 'missing',
        expiresInSeconds: 60,
      });
      expect(signed.ok).toBe(false);
      if (!signed.ok) {
        expect(signed.error.tag).toBe('app/file-storage-failed');
      }
    });

    it('removes an object, after which signing fails', async () => {
      const storage = await makeStorage();
      await storage.put({ path: 'a/b', bytes, mime: 'application/pdf' });
      const removed = await storage.remove('a/b');
      expect(removed.ok).toBe(true);

      const signed = await storage.getSignedUrl({
        path: 'a/b',
        expiresInSeconds: 60,
      });
      expect(signed.ok).toBe(false);
    });
  });
};
