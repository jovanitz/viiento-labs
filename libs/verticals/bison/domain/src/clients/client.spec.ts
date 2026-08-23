import { describe, expect, it } from 'vitest';
import {
  clientInitials,
  createClient,
  makeClientId,
  updateClientContact,
} from './client';
import type { ClientId } from './client';

const NOW = '2026-08-19T12:00:00.000Z';

const id = (raw: string): ClientId => {
  const made = makeClientId(raw);
  if (!made.ok) throw new Error('fixture id must be valid');
  return made.value;
};

describe('createClient', () => {
  it('creates a client with no channels connected', () => {
    const result = createClient({
      id: id('cli-1'),
      name: '  Diana Mendoza ',
      phone: ' 55 1234 5678 ',
      occurredAt: NOW,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe('Diana Mendoza');
    expect(result.value.phone).toBe('55 1234 5678');
    expect(result.value.channels).toEqual({
      telegram: 'not_connected',
      whatsapp: 'not_connected',
    });
  });

  it('defaults phone to empty — "none on file"', () => {
    const result = createClient({
      id: id('cli-1'),
      name: 'Diana',
      occurredAt: NOW,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.phone).toBe('');
  });

  it('rejects an empty name', () => {
    const result = createClient({
      id: id('cli-1'),
      name: '   ',
      occurredAt: NOW,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.tag).toBe('domain/invalid-client-name');
  });
});

describe('updateClientContact', () => {
  it('updates name/phone and bumps updatedAt', () => {
    const created = createClient({
      id: id('cli-1'),
      name: 'Diana',
      occurredAt: NOW,
    });
    if (!created.ok) throw new Error('fixture client must be valid');
    const later = '2026-08-20T09:00:00.000Z';
    const result = updateClientContact(
      created.value,
      { phone: '55 0000 0000' },
      later,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe('Diana');
    expect(result.value.phone).toBe('55 0000 0000');
    expect(result.value.updatedAt).toBe(later);
  });

  it('accepts a photo path under the client own prefix and clears on empty', () => {
    const created = createClient({
      id: id('cli-1'),
      name: 'Diana',
      occurredAt: NOW,
    });
    if (!created.ok) throw new Error('fixture client must be valid');
    const set = updateClientContact(
      created.value,
      { photoPath: 'clients/cli-1/foto-1' },
      NOW,
    );
    expect(set.ok).toBe(true);
    if (!set.ok) return;
    expect(set.value.photoPath).toBe('clients/cli-1/foto-1');
    const cleared = updateClientContact(set.value, { photoPath: '' }, NOW);
    expect(cleared.ok && cleared.value.photoPath === undefined).toBe(true);
  });

  it("rejects a photo path outside the client's prefix", () => {
    const created = createClient({
      id: id('cli-1'),
      name: 'Diana',
      occurredAt: NOW,
    });
    if (!created.ok) throw new Error('fixture client must be valid');
    const result = updateClientContact(
      created.value,
      { photoPath: 'clients/cli-2/foto-ajena' },
      NOW,
    );
    expect(!result.ok && result.error.tag).toBe('domain/invalid-client-photo');
  });
});

describe('clientInitials', () => {
  it('takes the first letters of the first two words', () => {
    expect(clientInitials('Diana Mendoza')).toBe('DM');
    expect(clientInitials('Diana')).toBe('D');
    expect(clientInitials('  ')).toBe('?');
  });
});
