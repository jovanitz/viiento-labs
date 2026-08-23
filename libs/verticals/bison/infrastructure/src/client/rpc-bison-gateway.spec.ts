import { describe, expect, it } from 'vitest';
import { err, ok } from '@acme/shared';
import type { ApiClient, ApiRequest } from '@acme/application';
import { createRpcBisonGateway } from './rpc-bison-gateway';

const fakeApi = (
  respond: (req: ApiRequest) => ReturnType<ApiClient['request']>,
) => {
  const requests: ApiRequest[] = [];
  const api: ApiClient = {
    request: (req) => {
      requests.push(req as ApiRequest);
      return respond(req as ApiRequest) as never;
    },
  };
  return { api, requests };
};

describe('createRpcBisonGateway', () => {
  it('POSTs each call to its rpc procedure path with the input as body', async () => {
    const { api, requests } = fakeApi(async () => ok({ data: [] }));
    const gateway = createRpcBisonGateway({ api });

    await gateway.templates.list();
    await gateway.timeline.log({
      clientId: 'c1',
      templateId: 't1',
      values: { motivo: 'x' },
    });

    expect(requests[0]).toMatchObject({
      method: 'POST',
      path: 'rpc/bison.templates.list',
      body: {},
    });
    expect(requests[1]).toMatchObject({
      path: 'rpc/bison.timeline.log',
      body: { clientId: 'c1', templateId: 't1', values: { motivo: 'x' } },
    });
  });

  it('unwraps the data envelope', async () => {
    const { api } = fakeApi(async () =>
      ok({ data: { id: 'cli-1', name: 'Diana' } }),
    );
    const result = await createRpcBisonGateway({ api }).clients.get({
      id: 'cli-1',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.name).toBe('Diana');
  });

  it('collapses 401/403 into access-denied and keeps other messages', async () => {
    const denied = createRpcBisonGateway({
      api: fakeApi(async () =>
        err({ tag: 'api/status', message: 'forbidden', status: 403 }),
      ).api,
    });
    const deniedResult = await denied.clients.list();
    expect(deniedResult.ok).toBe(false);
    if (!deniedResult.ok) {
      expect(deniedResult.error.tag).toBe('app/access-denied');
    }

    const broken = createRpcBisonGateway({
      api: fakeApi(async () => err({ tag: 'api/network', message: 'offline' }))
        .api,
    });
    const brokenResult = await broken.clients.list();
    expect(brokenResult.ok).toBe(false);
    if (!brokenResult.ok) {
      expect(brokenResult.error.tag).toBe('app/bison-gateway-error');
      expect(brokenResult.error.message).toBe('offline');
    }
  });
});

describe('files.attach — direct upload with fallback', () => {
  const input = {
    clientId: 'cli-1',
    name: 'radiografia.png',
    mime: 'image/png',
    bytesBase64: btoa('PNGDATA'),
  };

  it('reserves a slot, PUTs the raw bytes, and returns the ready value', async () => {
    const { api, requests } = fakeApi(async (req) =>
      req.operation === 'bison.files.uploadUrl'
        ? ok({
            data: { uploadUrl: 'https://bucket/upload?token=t', value: 'REF' },
          })
        : err({ tag: 'api/status', message: 'should not be called' }),
    );
    const puts: Array<{ url: string; mime: string; size: number }> = [];
    const fetchFn = (async (url: unknown, init?: RequestInit) => {
      puts.push({
        url: String(url),
        mime: (init?.headers as Record<string, string>)['Content-Type'],
        size: (init?.body as ArrayBuffer).byteLength,
      });
      return new Response('{}', { status: 200 });
    }) as typeof fetch;

    const result = await createRpcBisonGateway({ api, fetchFn }).files.attach(
      input,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('REF');
    expect(puts).toEqual([
      { url: 'https://bucket/upload?token=t', mime: 'image/png', size: 7 },
    ]);
    expect(requests.map((r) => r.operation)).toEqual(['bison.files.uploadUrl']);
  });

  it('falls back to the base64 attach when the slot is unavailable', async () => {
    const { api, requests } = fakeApi(async (req) =>
      req.operation === 'bison.files.uploadUrl'
        ? err({ tag: 'api/status', message: 'no storage', status: 502 })
        : ok({ data: 'REF-FALLBACK' }),
    );
    const result = await createRpcBisonGateway({
      api,
      fetchFn: (async () => {
        throw new Error('must not PUT');
      }) as typeof fetch,
    }).files.attach(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('REF-FALLBACK');
    expect(requests.map((r) => r.operation)).toEqual([
      'bison.files.uploadUrl',
      'bison.files.attach',
    ]);
  });

  it('falls back when the PUT itself fails', async () => {
    const { api, requests } = fakeApi(async (req) =>
      req.operation === 'bison.files.uploadUrl'
        ? ok({ data: { uploadUrl: 'https://bucket/u', value: 'REF' } })
        : ok({ data: 'REF-FALLBACK' }),
    );
    const result = await createRpcBisonGateway({
      api,
      fetchFn: (async () => new Response('nope', { status: 500 })) as typeof fetch,
    }).files.attach(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('REF-FALLBACK');
    expect(requests.map((r) => r.operation)).toEqual([
      'bison.files.uploadUrl',
      'bison.files.attach',
    ]);
  });
});
