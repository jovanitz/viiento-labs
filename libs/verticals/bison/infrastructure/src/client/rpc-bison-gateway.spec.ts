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
