import { describe, expect, it } from 'vitest';
import type { BusinessIdentity } from '@acme/bison-domain';
import { makeIdentityUseCases } from './use-cases';

/** Headless proof over an inline fake repo: honest empty default, partial
 *  update semantics, shape rejection. */
const NOW = new Date('2026-08-21T18:00:00.000Z');

const harness = () => {
  let row: BusinessIdentity | null = null;
  return makeIdentityUseCases({
    identity: {
      get: async () => row,
      save: async (next) => {
        row = next;
      },
    },
    clock: { now: () => NOW },
  });
};

describe('identity use cases', () => {
  it('answers the empty identity until the business saves one', async () => {
    const uc = harness();
    const empty = await uc.get();
    expect(empty.name).toBe('');
    expect(empty.logoPath).toBe('');
  });

  it('updates partially, keeps the rest, stamps updatedAt', async () => {
    const uc = harness();
    const first = await uc.update({
      changes: { name: 'Aurora', phone: '55 1234 5678' },
    });
    expect(first.ok && first.value.name).toBe('Aurora');
    const second = await uc.update({ changes: { address: 'Reforma 123' } });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.name).toBe('Aurora');
    expect(second.value.address).toBe('Reforma 123');
    expect(second.value.updatedAt).toBe(NOW.toISOString());
    expect((await uc.get()).phone).toBe('55 1234 5678');
  });

  it('rejects malformed changes as a Result', async () => {
    const uc = harness();
    const bad = await uc.update({ changes: { logoPath: 'clients/x/y' } });
    expect(!bad.ok && bad.error.tag).toBe('domain/invalid-business-identity');
  });
});
