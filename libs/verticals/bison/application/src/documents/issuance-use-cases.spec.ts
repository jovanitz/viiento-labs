import { describe, expect, it } from 'vitest';
import { err, ok } from '@acme/shared';
import type {
  BusinessIdentity,
  Entry,
  IssuedDocument,
  Template,
} from '@acme/bison-domain';
import { makeIssuanceUseCases } from './issuance-use-cases';
import { makeGetFileUrl } from '../files/use-cases';

/** Headless proof over inline fakes (no adapters): folio allocation,
 *  frozen snapshot, exactly-once bytes, void — and the reprint URL. */
const NOW = new Date('2026-08-21T18:00:00.000Z');

const world = () => {
  const issues = new Map<string, IssuedDocument>();
  const entries: Entry[] = [];
  const templates = new Map<string, Template>();
  const formats = new Map<string, never>();
  const objects = new Map<string, Uint8Array>();
  let identityRow: BusinessIdentity | null = null;
  let folio = 1;
  let seq = 0;
  const store = {
    issued: {
      findById: async (id: string) => issues.get(id) ?? null,
      listByEntry: async (entryId: string) =>
        [...issues.values()]
          .filter((issue) => issue.entryId === entryId)
          .sort((a, b) => b.folio - a.folio),
      save: async (issue: IssuedDocument) => {
        issues.set(issue.id, issue);
      },
    },
    folios: { next: async () => folio++ },
    entries: {
      append: async (entry: Entry) => {
        entries.push(entry);
      },
      findById: async (id: string) =>
        entries.find((entry) => entry.id === id) ?? null,
      listByClient: async () => entries,
    },
    templates: {
      findById: async (id: string) => templates.get(id) ?? null,
      list: async () => [...templates.values()],
      save: async (template: Template) => {
        templates.set(template.id, template);
      },
    },
    formats: {
      findById: async (id: string) => formats.get(id) ?? null,
      list: async () => [...formats.values()],
      save: async (format: never) => {
        formats.set((format as { id: string }).id, format);
      },
    },
    clients: {
      findById: async () => null,
      list: async () => [],
      save: async () => undefined,
    },
    identity: {
      get: async () => identityRow,
      save: async (next: NonNullable<typeof identityRow>) => {
        identityRow = next;
      },
    },
  };
  const files = {
    objects,
    put: async ({ path, bytes }: { path: string; bytes: Uint8Array }) => {
      objects.set(path, bytes);
      return ok(undefined);
    },
    getSignedUrl: async ({ path }: { path: string }) =>
      objects.has(path)
        ? ok(`memory://${path}`)
        : err({ tag: 'app/file-storage-failed' as const, message: 'missing' }),
    createSignedUploadUrl: async () =>
      err({ tag: 'app/file-storage-failed' as const, message: 'no' }),
    remove: async () => ok(undefined),
  };
  const deps = {
    ...store,
    files,
    clock: { now: () => NOW },
    ids: { next: () => `00000000-0000-4000-8000-00000000000${++seq}` },
  } as never as Parameters<typeof makeIssuanceUseCases>[0];
  return { store, files, uc: makeIssuanceUseCases(deps), deps };
};

const seed = async (store: ReturnType<typeof world>['store']) => {
  await store.identity.save({
    name: 'Aurora',
    address: '',
    phone: '',
    license: 'Céd. 123',
    logoPath: '',
    updatedAt: NOW.toISOString(),
  });
  const template = {
    id: 'tpl-1',
    name: 'Evidencia',
    description: '',
    icon: 'stethoscope',
    color: 'teal',
    kind: 'custom',
    blocks: [],
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  } as unknown as Template;
  await store.templates.save(template);
  const entry = {
    id: 'ent-1',
    clientId: 'cli-1',
    templateId: 'tpl-1',
    templateName: 'Evidencia',
    icon: 'stethoscope',
    color: 'teal',
    at: NOW.toISOString(),
    summary: 'Consulta',
    fields: [{ blockId: 'b1', label: 'Motivo', value: 'Consulta' }],
  } as unknown as Entry;
  await store.entries.append(entry);
  const format = {
    id: 'fmt-1',
    name: 'Receta',
    themeId: 'clinical',
    paper: 'letter',
    headerTokens: ['business.name'],
    footerTokens: ['document.folio'],
    marks: [],
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  } as never;
  await store.formats.save(format);
};

describe('issuance', () => {
  it('allocates monotonic folios and freezes a self-contained snapshot', async () => {
    const { store, uc } = world();
    await seed(store);
    const first = await uc.issue({
      entryId: 'ent-1',
      formatId: 'fmt-1',
      issuedBy: 'u1',
    });
    const second = await uc.issue({
      entryId: 'ent-1',
      formatId: 'fmt-1',
      issuedBy: 'u1',
    });
    expect(first.ok && first.value.folioLabel).toBe('0001');
    expect(second.ok && second.value.folioLabel).toBe('0002');
    if (!first.ok) return;
    expect(first.value.tokens['business.name']).toBe('Aurora');
    expect(first.value.tokens['business.license']).toBe('Céd. 123');
    expect(first.value.tokens['document.folio']).toBe('0001');
    const stored = await store.issued.findById(first.value.id as never);
    expect(stored?.snapshot.values).toEqual({ b1: 'Consulta' });
  });

  it('refuses unknown targets', async () => {
    const { store, uc } = world();
    await seed(store);
    const noEntry = await uc.issue({
      entryId: 'nope',
      formatId: 'fmt-1',
      issuedBy: 'u1',
    });
    expect(!noEntry.ok && noEntry.error.tag).toBe('app/issue-target-not-found');
    const noFormat = await uc.issue({
      entryId: 'ent-1',
      formatId: 'nope',
      issuedBy: 'u1',
    });
    expect(noFormat.ok).toBe(false);
  });

  it('attaches bytes exactly once and signs the reprint URL', async () => {
    const { store, files, uc, deps } = world();
    await seed(store);
    const issued = await uc.issue({
      entryId: 'ent-1',
      formatId: 'fmt-1',
      issuedBy: 'u1',
    });
    if (!issued.ok) throw new Error('issue must succeed');
    const attached = await uc.attachPdf({
      issueId: issued.value.id,
      bytes: new Uint8Array([1, 2, 3]),
    });
    expect(attached.ok && attached.value.pdfPath).toBe(
      `issued/${issued.value.id}`,
    );
    expect(files.objects.has(`issued/${issued.value.id}`)).toBe(true);
    const again = await uc.attachPdf({
      issueId: issued.value.id,
      bytes: new Uint8Array([9]),
    });
    expect(again.ok).toBe(false);

    const url = await makeGetFileUrl(deps)({
      storagePath: `issued/${issued.value.id}`,
    });
    expect(url.ok).toBe(true);
    // A path nothing owns never signs.
    const foreign = await makeGetFileUrl(deps)({ storagePath: 'issued/nope' });
    expect(foreign.ok).toBe(false);
  });

  it('voids once, listing newest folio first', async () => {
    const { store, uc } = world();
    await seed(store);
    const a = await uc.issue({
      entryId: 'ent-1',
      formatId: 'fmt-1',
      issuedBy: 'u1',
    });
    const b = await uc.issue({
      entryId: 'ent-1',
      formatId: 'fmt-1',
      issuedBy: 'u1',
    });
    if (!a.ok || !b.ok) throw new Error('issues must succeed');
    const voided = await uc.voidIssue({
      issueId: a.value.id,
      supersededBy: b.value.id,
    });
    expect(voided.ok && voided.value.status).toBe('voided');
    const listed = await uc.list({ entryId: 'ent-1' });
    expect(listed.map((issue) => issue.folioLabel)).toEqual(['0002', '0001']);
    if (!voided.ok) return;
    expect((await uc.voidIssue({ issueId: a.value.id })).ok).toBe(false);
  });
});
