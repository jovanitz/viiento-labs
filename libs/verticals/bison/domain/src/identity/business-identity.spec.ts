import { describe, expect, it } from 'vitest';
import {
  EMPTY_BUSINESS_IDENTITY,
  updateBusinessIdentity,
} from './business-identity';

const NOW = '2026-08-21T12:00:00.000Z';

describe('updateBusinessIdentity', () => {
  it('fills fields over the empty identity, trimming', () => {
    const result = updateBusinessIdentity(
      EMPTY_BUSINESS_IDENTITY,
      { name: '  Consultorio Aurora ', phone: '55 1234 5678' },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe('Consultorio Aurora');
    expect(result.value.phone).toBe('55 1234 5678');
    expect(result.value.address).toBe('');
    expect(result.value.updatedAt).toBe(NOW);
  });

  it('keeps untouched fields and clears with empty string', () => {
    const filled = updateBusinessIdentity(
      EMPTY_BUSINESS_IDENTITY,
      { name: 'Aurora', address: 'Reforma 123' },
      NOW,
    );
    if (!filled.ok) throw new Error('fixture must be valid');
    const cleared = updateBusinessIdentity(filled.value, { address: '' }, NOW);
    expect(cleared.ok && cleared.value.name).toBe('Aurora');
    expect(cleared.ok && cleared.value.address).toBe('');
  });

  it('rejects oversized fields and foreign logo paths', () => {
    const tooLong = updateBusinessIdentity(
      EMPTY_BUSINESS_IDENTITY,
      { name: 'x'.repeat(121) },
      NOW,
    );
    expect(!tooLong.ok && tooLong.error.tag).toBe(
      'domain/invalid-business-identity',
    );
    const foreign = updateBusinessIdentity(
      EMPTY_BUSINESS_IDENTITY,
      { logoPath: 'clients/c1/f1' },
      NOW,
    );
    expect(foreign.ok).toBe(false);
    const own = updateBusinessIdentity(
      EMPTY_BUSINESS_IDENTITY,
      { logoPath: 'identity/logo-1' },
      NOW,
    );
    expect(own.ok && own.value.logoPath).toBe('identity/logo-1');
  });
});
