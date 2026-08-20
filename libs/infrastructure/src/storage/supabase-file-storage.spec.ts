import { describe, expect, it } from 'vitest';
import { fileStorageContract } from '../testing/file-storage-contract';
import { createSupabaseFileStorage } from './supabase-file-storage';

const BASE = 'https://proj.supabase.co/storage/v1';

/**
 * A fake of the three Storage endpoints over a Map, so the SAME contract
 * the in-memory adapter passes runs against this adapter's real request/
 * response handling (same approach as the GoTrue auth specs: fake fetch,
 * no supabase-js).
 */
const fakeStorageApi = () => {
  const objects = new Set<string>();
  const requests: Array<{
    readonly method: string;
    readonly url: string;
    readonly headers: Record<string, string>;
  }> = [];

  const signPrefix = `${BASE}/object/sign/`;
  const objectPrefix = `${BASE}/object/`;

  const sign = (key: string): Response =>
    objects.has(key)
      ? new Response(
          JSON.stringify({ signedURL: `/object/sign/${key}?token=fake` }),
          { status: 200 },
        )
      : new Response('not found', { status: 404 });

  const upload = (key: string): Response => {
    objects.add(key);
    return new Response('{}', { status: 200 });
  };

  const destroy = (key: string): Response =>
    objects.delete(key)
      ? new Response('{}', { status: 200 })
      : new Response('not found', { status: 404 });

  const route = (method: string, url: string): Response => {
    if (method === 'POST' && url.startsWith(signPrefix)) {
      return sign(url.slice(signPrefix.length));
    }
    if (method === 'POST' && url.startsWith(objectPrefix)) {
      return upload(url.slice(objectPrefix.length));
    }
    if (method === 'DELETE' && url.startsWith(objectPrefix)) {
      return destroy(url.slice(objectPrefix.length));
    }
    return new Response('unexpected', { status: 500 });
  };

  const fetchFn: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    requests.push({
      method,
      url,
      headers: (init?.headers ?? {}) as Record<string, string>,
    });
    return route(method, url);
  };

  return { fetchFn, requests };
};

const makeStorage = () => {
  const api = fakeStorageApi();
  const storage = createSupabaseFileStorage({
    supabaseUrl: 'https://proj.supabase.co',
    serviceKey: 'service-key',
    bucket: 'bison-files',
    fetchFn: api.fetchFn,
  });
  return { storage, api };
};

fileStorageContract('supabase (fake fetch)', () => makeStorage().storage);

describe('createSupabaseFileStorage', () => {
  it('uploads with the service bearer and the file mime', async () => {
    const { storage, api } = makeStorage();
    await storage.put({
      path: 'clients/c1/f1',
      bytes: new Uint8Array([1]),
      mime: 'application/pdf',
    });
    const request = api.requests[0];
    expect(request?.url).toBe(`${BASE}/object/bison-files/clients/c1/f1`);
    expect(request?.headers['Authorization']).toBe('Bearer service-key');
    expect(request?.headers['Content-Type']).toBe('application/pdf');
  });

  it('resolves the signed URL against the project base', async () => {
    const { storage } = makeStorage();
    await storage.put({
      path: 'clients/c1/f1',
      bytes: new Uint8Array([1]),
      mime: 'image/png',
    });
    const signed = await storage.getSignedUrl({
      path: 'clients/c1/f1',
      expiresInSeconds: 60,
    });
    expect(signed.ok).toBe(true);
    if (signed.ok) {
      expect(signed.value).toBe(
        `${BASE}/object/sign/bison-files/clients/c1/f1?token=fake`,
      );
    }
  });

  it('returns a Result on network failure, never throws', async () => {
    const storage = createSupabaseFileStorage({
      supabaseUrl: 'https://proj.supabase.co',
      serviceKey: 'service-key',
      bucket: 'bison-files',
      fetchFn: async () => {
        throw new Error('offline');
      },
    });
    const result = await storage.put({
      path: 'x',
      bytes: new Uint8Array(),
      mime: 'text/plain',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.tag).toBe('app/file-storage-failed');
      expect(result.error.message).toContain('offline');
    }
  });
});
