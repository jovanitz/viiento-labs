import { describe, expect, it } from 'vitest';
import { ok } from '@acme/shared';
import type { AuditRecordDto } from '@acme/application';
import { createAuditStore, type AuditStoreDeps } from './audit-store';

const snapshot = (
  permissions: ReadonlyArray<{ action: string; scope: string }>,
) => ({
  membershipId: 'mem',
  userId: 'u',
  accountId: 'acc',
  accountStatus: 'active',
  blocked: false,
  session: { id: 's', status: 'active', expiresAt: '2099-01-01T00:00:00Z' },
  permissions,
  activeGrants: [],
});

const dto: AuditRecordDto = {
  id: 'a1',
  type: 'account.disabled',
  category: 'access',
  occurredAt: '2026-07-24T12:00:00.000Z',
  actor: 'support@acme.test',
  target: { kind: 'org', id: 'acc-1', label: 'Clínica Norte' },
};

const makeDeps = (over: Record<string, unknown> = {}) =>
  ({
    access: {
      currentAccess: async () =>
        ok(snapshot([{ action: 'audit.read', scope: 'any' }])),
    },
    audit: { list: async () => ok([dto]) },
    ...over,
  }) as unknown as AuditStoreDeps;

describe('createAuditStore', () => {
  it('maps the enriched rows into the VM (labels + formatted time)', async () => {
    const store = createAuditStore(makeDeps());
    await store.getState().load();
    const vm = store.getState().vm;
    expect(vm.loading).toBeFalsy();
    expect(vm.entries).toHaveLength(1);
    expect(vm.entries[0]).toMatchObject({
      type: 'account.disabled',
      category: 'access',
      actor: 'support@acme.test',
      target: { label: 'Clínica Norte', kind: 'org', id: 'acc-1' },
    });
    expect(vm.entries[0]?.occurredAt).toBe('2026-07-24 12:00 UTC');
  });

  it('hides the trail when the actor lacks audit.read', async () => {
    const store = createAuditStore(
      makeDeps({
        access: { currentAccess: async () => ok(snapshot([])) },
      }),
    );
    await store.getState().load();
    expect(store.getState().vm.hidden).toBe(true);
    expect(store.getState().vm.entries).toHaveLength(0);
  });

  it('drops null actor/target so the row leaves them absent', async () => {
    const bare: AuditRecordDto = {
      id: 'a2',
      type: 'login.failed',
      category: 'access',
      occurredAt: '2026-07-24T09:00:00.000Z',
      actor: null,
      target: null,
    };
    const store = createAuditStore(
      makeDeps({ audit: { list: async () => ok([bare]) } }),
    );
    await store.getState().load();
    const row = store.getState().vm.entries[0];
    expect(row?.actor).toBeUndefined();
    expect(row?.target).toBeUndefined();
  });
});
