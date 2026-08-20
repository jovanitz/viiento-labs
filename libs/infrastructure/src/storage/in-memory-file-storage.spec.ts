import { describe, expect, it } from 'vitest';
import { fileStorageContract } from '../testing/file-storage-contract';
import { createInMemoryFileStorage } from './in-memory-file-storage';

fileStorageContract('in-memory', () => createInMemoryFileStorage());

describe('createInMemoryFileStorage', () => {
  it('exposes the stored objects for assertions', async () => {
    const storage = createInMemoryFileStorage();
    await storage.put({
      path: 'clients/c1/f1',
      bytes: new Uint8Array([7]),
      mime: 'image/png',
    });
    expect(storage.objects.get('clients/c1/f1')?.mime).toBe('image/png');
  });
});
