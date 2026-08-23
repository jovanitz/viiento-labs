import { describe, expect, it } from 'vitest';
import type { BusinessIdentity } from '@acme/bison-domain';
import type { BisonAccountStore } from '../persistence/in-memory-bison-store';

/** Contract for the business-identity repository — every adapter must
 *  satisfy it. `makeStore` must return a FRESH, EMPTY account world. */
const IDENTITY: BusinessIdentity = {
  name: 'Consultorio Aurora',
  address: 'Av. Reforma 123, CDMX',
  phone: '55 1234 5678',
  license: 'Céd. Prof. 1234567',
  logoPath: 'identity/logo-1',
  updatedAt: '2026-08-21T12:00:00.000Z',
};

export const bisonIdentityContract = (
  name: string,
  makeStore: () => BisonAccountStore | Promise<BisonAccountStore>,
): void => {
  describe(`BusinessIdentityRepository contract (${name})`, () => {
    it('starts with nothing on file', async () => {
      const store = await makeStore();
      expect(await store.identity.get()).toBeNull();
    });

    it('round-trips the identity and upserts in place', async () => {
      const store = await makeStore();
      await store.identity.save(IDENTITY);
      expect(await store.identity.get()).toEqual(IDENTITY);
      const changed = { ...IDENTITY, phone: '55 0000 0000' };
      await store.identity.save(changed);
      expect(await store.identity.get()).toEqual(changed);
    });
  });
};
