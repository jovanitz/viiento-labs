import { describe, expect, it } from 'vitest';
import {
  err,
  fixedClock,
  noopLogger,
  ok,
  sequentialIdGenerator,
} from '@acme/shared';
import type { FileStorage } from '@acme/application';
import { fileStorageFailed } from '@acme/application';
import { decodeFileRef } from '@acme/bison-domain';
import { makeClientUseCases } from '../clients/use-cases';
import type { Client } from '@acme/bison-domain';
import type { ClientRepository } from '../clients/ports';
import { makeFileUseCases } from './use-cases';

const inMemoryClients = (): ClientRepository => {
  const store = new Map<string, Client>();
  return {
    findById: async (id) => store.get(id) ?? null,
    list: async () => [...store.values()],
    save: async (client) => {
      store.set(client.id, client);
    },
  };
};

const inMemoryStorage = () => {
  const objects = new Map<string, { bytes: Uint8Array; mime: string }>();
  const storage: FileStorage = {
    put: async ({ path, bytes, mime }) => {
      objects.set(path, { bytes, mime });
      return ok(undefined);
    },
    getSignedUrl: async ({ path }) =>
      objects.has(path)
        ? ok(`memory://${path}`)
        : err(fileStorageFailed(`No object at ${path}.`)),
    remove: async (path) => {
      objects.delete(path);
      return ok(undefined);
    },
  };
  return { storage, objects };
};

const harness = async () => {
  const clients = inMemoryClients();
  const { storage, objects } = inMemoryStorage();
  const created = await makeClientUseCases({
    clients,
    clock: fixedClock(new Date('2026-08-19T12:00:00.000Z')),
    ids: sequentialIdGenerator('cli'),
    logger: noopLogger,
  }).create({ name: 'Diana' });
  if (!created.ok) throw new Error('fixture client must succeed');
  const files = makeFileUseCases({
    files: storage,
    clients,
    ids: sequentialIdGenerator('file'),
  });
  return { files, objects, clientId: created.value.id };
};

describe('file use cases', () => {
  it('attaches bytes and signs the stored path back', async () => {
    const { files, objects, clientId } = await harness();
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const attached = await files.attach({
      clientId,
      name: 'radiografia.png',
      mime: 'image/png',
      bytes,
    });
    expect(attached.ok).toBe(true);
    if (!attached.ok) return;

    const ref = decodeFileRef(attached.value);
    if (!ref) throw new Error('attach must return a decodable ref');
    expect(ref.name).toBe('radiografia.png');
    expect(ref.size).toBe(4);
    expect(ref.storagePath).toBe(`clients/${clientId}/file-1`);
    expect(objects.get(ref.storagePath)?.mime).toBe('image/png');

    const url = await files.url({ storagePath: ref.storagePath });
    expect(url.ok).toBe(true);
    if (url.ok) expect(url.value).toContain(ref.storagePath);
  });

  it('refuses to attach to a client outside this world', async () => {
    const { files } = await harness();
    const attached = await files.attach({
      clientId: 'cli-ajena',
      name: 'x.pdf',
      mime: 'application/pdf',
      bytes: new Uint8Array(),
    });
    expect(attached.ok).toBe(false);
    if (!attached.ok) expect(attached.error.tag).toBe('app/client-not-found');
  });

  it("refuses to sign a malformed path or another tenant's client", async () => {
    const { files } = await harness();

    const malformed = await files.url({ storagePath: '../secrets/key' });
    expect(malformed.ok).toBe(false);
    if (!malformed.ok) {
      expect(malformed.error.tag).toBe('app/file-path-invalid');
    }

    const foreign = await files.url({
      storagePath: 'clients/cli-ajena/file-9',
    });
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.error.tag).toBe('app/client-not-found');
  });

  it('propagates a storage failure as a Result, never a throw', async () => {
    const clients = inMemoryClients();
    const created = await makeClientUseCases({
      clients,
      clock: fixedClock(new Date('2026-08-19T12:00:00.000Z')),
      ids: sequentialIdGenerator('cli'),
      logger: noopLogger,
    }).create({ name: 'Diana' });
    if (!created.ok) throw new Error('fixture client must succeed');

    const failing = makeFileUseCases({
      files: {
        put: async () => err(fileStorageFailed('bucket unreachable')),
        getSignedUrl: async () => err(fileStorageFailed('bucket unreachable')),
        remove: async () => err(fileStorageFailed('bucket unreachable')),
      },
      clients,
      ids: sequentialIdGenerator('file'),
    });
    const result = await failing.attach({
      clientId: created.value.id,
      name: 'x.pdf',
      mime: 'application/pdf',
      bytes: new Uint8Array(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.tag).toBe('app/file-storage-failed');
  });
});
