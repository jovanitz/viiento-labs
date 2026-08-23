import { describe, expect, it } from 'vitest';
import { err, ok } from '@acme/shared';
import { encodeFileRef } from '@acme/bison-domain';
import { bisonGatewayError } from '../../../client/gateway';
import type { BisonClientGateway } from '../../../client/gateway';
import { logTimelineEntry } from '../clients';
import { getFileUrl, pendingFileOf, storeFillFiles } from './fill-files';


const PNG_DATA_URL = 'data:image/png;base64,AAAABBBB';
const pendingValue = JSON.stringify({
  kind: 'file',
  name: 'radiografia.png',
  mime: 'image/png',
  size: 8,
  dataUrl: PNG_DATA_URL,
});

const storedRef = encodeFileRef({
  name: 'radiografia.png',
  mime: 'image/png',
  size: 8,
  storagePath: 'clients/cli-1/file-1',
});

const fakeGateway = (failAttach = false) => {
  const attached: Array<{ clientId: string; name: string; mime: string }> = [];
  const logged: Array<Readonly<Record<string, string>>> = [];
  const gateway = {
    files: {
      attach: async (input: {
        clientId: string;
        name: string;
        mime: string;
        bytesBase64: string;
      }) => {
        if (failAttach) return err(bisonGatewayError('bucket unreachable'));
        attached.push(input);
        return ok(storedRef);
      },
    },
    timeline: {
      log: async (input: { values: Readonly<Record<string, string>> }) => {
        logged.push(input.values);
        return ok({
          id: 'ent-1',
          clientId: 'cli-1',
          templateId: 'tpl-1',
          templateName: 'Consulta',
          icon: 'stethoscope',
          color: 'teal',
          at: '2026-08-20T15:30:00.000Z',
          summary: 'radiografia.png',
          fields: [],
        });
      },
    },
  } as unknown as BisonClientGateway;
  return { gateway, attached, logged };
};

describe('pendingFileOf', () => {
  it('recognizes the prototype envelope and extracts the bytes', () => {
    expect(pendingFileOf(pendingValue)).toEqual({
      name: 'radiografia.png',
      mime: 'image/png',
      bytesBase64: 'AAAABBBB',
    });
  });

  it('passes through text, stored refs, and malformed values', () => {
    expect(pendingFileOf('Dolor de cabeza')).toBeNull();
    expect(pendingFileOf(storedRef)).toBeNull();
    expect(pendingFileOf('{not json')).toBeNull();
  });
});

describe('storeFillFiles / logTimelineEntry', () => {
  it('uploads pending files and logs FileRef values in their place', async () => {
    const { gateway, attached, logged } = fakeGateway();
    const result = await logTimelineEntry(
      { gateway },
      {
        clientId: 'cli-1',
        templateId: 'tpl-1',
        values: { motivo: 'Chequeo', estudio: pendingValue },
      },
    );
    expect(result.ok).toBe(true);
    expect(attached).toEqual([
      {
        clientId: 'cli-1',
        name: 'radiografia.png',
        mime: 'image/png',
        bytesBase64: 'AAAABBBB',
      },
    ]);
    expect(logged[0]).toEqual({ motivo: 'Chequeo', estudio: storedRef });
  });

  it('aborts the whole log when an upload fails', async () => {
    const { gateway, logged } = fakeGateway(true);
    const result = await logTimelineEntry(
      { gateway },
      {
        clientId: 'cli-1',
        templateId: 'tpl-1',
        values: { estudio: pendingValue },
      },
    );
    expect(result.ok).toBe(false);
    expect(logged).toHaveLength(0);
  });

  it('leaves an all-text fill untouched', async () => {
    const { gateway, attached } = fakeGateway();
    const result = await storeFillFiles({ gateway }, 'cli-1', {
      motivo: 'Chequeo',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ motivo: 'Chequeo' });
    expect(attached).toHaveLength(0);
  });
});

describe('getFileUrl', () => {
  it('passes the stored path through to the gateway', async () => {
    const gateway = {
      files: {
        url: async ({ storagePath }: { storagePath: string }) =>
          ok(`signed://${storagePath}`),
      },
    } as unknown as Parameters<typeof getFileUrl>[0]['gateway'];
    const result = await getFileUrl({ gateway }, { storagePath: 'clients/c/f' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('signed://clients/c/f');
  });
});
