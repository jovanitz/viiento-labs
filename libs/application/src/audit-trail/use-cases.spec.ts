import { describe, expect, it } from 'vitest';
import { fixedClock } from '@acme/shared';
import type { AccessAuditEvent } from '@acme/domain';
import { TEST_ACCESS_NOW, testAccessActor } from '../access/testing';
import type {
  AccessAuditFilter,
  AccessAuditRecord,
  AuditLabelResolver,
} from './ports';
import { makeAuditTrailUseCases } from './use-cases';

const emptyResolver: AuditLabelResolver = {
  resolve: async () => ({
    memberships: new Map(),
    accounts: new Map(),
    users: new Map(),
    sessions: new Map(),
  }),
};

const inMemoryTrail = (seed: AccessAuditEvent[] = []) => {
  const records: AccessAuditRecord[] = seed.map((event, index) => ({
    id: `audit-${index}`,
    event,
  }));
  return {
    records,
    port: {
      append: async (event: AccessAuditEvent) => {
        records.push({ id: `audit-${records.length}`, event });
      },
      list: async (filter?: AccessAuditFilter) =>
        records.filter(
          (record) =>
            !filter?.types || filter.types.includes(record.event.type),
        ),
    },
  };
};

const loginEvent: AccessAuditEvent = {
  type: 'login.failed',
  attemptedIdentifier: 'someone@example.com',
  occurredAt: TEST_ACCESS_NOW,
};

const deps = (
  trail: ReturnType<typeof inMemoryTrail>,
  resolver: AuditLabelResolver = emptyResolver,
) => ({
  trail: trail.port,
  resolver,
  clock: fixedClock(new Date(TEST_ACCESS_NOW)),
});

describe('listAuditEvents', () => {
  it('lets an owner read the trail, honouring filters', async () => {
    const trail = inMemoryTrail([loginEvent]);
    const uc = makeAuditTrailUseCases(deps(trail));
    const all = await uc.listAuditEvents({
      actor: testAccessActor({ preset: 'owner' }),
    });
    expect(all.ok).toBe(true);
    if (all.ok) expect(all.value).toHaveLength(1);

    const filtered = await uc.listAuditEvents({
      actor: testAccessActor({ preset: 'owner' }),
      filter: { types: ['impersonation.started'] },
    });
    expect(filtered.ok).toBe(true);
    if (filtered.ok) expect(filtered.value).toHaveLength(0);
  });

  it('denies support and customers', async () => {
    const trail = inMemoryTrail([loginEvent]);
    const uc = makeAuditTrailUseCases(deps(trail));
    for (const preset of ['support', 'customer'] as const) {
      const r = await uc.listAuditEvents({
        actor: testAccessActor({ preset }),
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.tag).toBe('app/access-denied');
    }
  });

  it("an org admin reads only their own account's slice, never the global trail", async () => {
    const trail = inMemoryTrail([loginEvent]);
    const uc = makeAuditTrailUseCases(deps(trail));
    const orgAdmin = testAccessActor({
      preset: 'customer-admin',
      accountId: 'acct-1',
    });

    const ownSlice = await uc.listAuditEvents({
      actor: orgAdmin,
      filter: { accountId: 'acct-1' },
    });
    expect(ownSlice.ok).toBe(true);

    const global = await uc.listAuditEvents({ actor: orgAdmin });
    expect(global.ok).toBe(false);
    if (!global.ok) expect(global.error.tag).toBe('app/access-denied');

    const foreign = await uc.listAuditEvents({
      actor: orgAdmin,
      filter: { accountId: 'acct-other' },
    });
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.error.tag).toBe('app/access-denied');
  });
});

describe('listAuditView', () => {
  it('projects records and resolves their ids to labels', async () => {
    const trail = inMemoryTrail([
      {
        type: 'account.disabled',
        accountId: 'acc-cust',
        actorMembershipId: 'mem-support',
        reason: null,
        occurredAt: TEST_ACCESS_NOW,
      },
    ]);
    const resolver: AuditLabelResolver = {
      resolve: async (refs) => {
        expect(refs.memberships).toContain('mem-support');
        expect(refs.accounts).toContain('acc-cust');
        return {
          memberships: new Map([
            [
              'mem-support',
              {
                label: 'support@acme.test',
                accountId: 'acc-staff',
                accountName: 'Acme Staff',
                kind: 'staff' as const,
              },
            ],
          ]),
          accounts: new Map([
            ['acc-cust', { name: 'Clínica Norte', kind: 'customer' as const }],
          ]),
          users: new Map(),
          sessions: new Map(),
        };
      },
    };
    const uc = makeAuditTrailUseCases(deps(trail, resolver));
    const r = await uc.listAuditView({
      actor: testAccessActor({ preset: 'owner' }),
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toHaveLength(1);
      expect(r.value[0]).toMatchObject({
        type: 'account.disabled',
        category: 'access',
        actor: 'support@acme.test',
        target: { kind: 'org', id: 'acc-cust', label: 'Clínica Norte' },
      });
    }
  });

  it('denies the same callers as the raw list (support/customer)', async () => {
    const trail = inMemoryTrail([loginEvent]);
    const uc = makeAuditTrailUseCases(deps(trail));
    const r = await uc.listAuditView({
      actor: testAccessActor({ preset: 'support' }),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.tag).toBe('app/access-denied');
  });

  it('scopes resolution: null viewer for any-scope, own account for own-scope', async () => {
    const trail = inMemoryTrail([loginEvent]);
    const seen: (string | null)[] = [];
    const resolver: AuditLabelResolver = {
      resolve: async (_refs, viewerAccountId) => {
        seen.push(viewerAccountId);
        return {
          memberships: new Map(),
          accounts: new Map(),
          users: new Map(),
          sessions: new Map(),
        };
      },
    };
    const uc = makeAuditTrailUseCases(deps(trail, resolver));
    // Platform owner reads the global trail → any-scope → unrestricted (null).
    await uc.listAuditView({ actor: testAccessActor({ preset: 'owner' }) });
    // Org admin reads only their account's slice → own-scope → confined to it.
    await uc.listAuditView({
      actor: testAccessActor({ preset: 'customer-admin', accountId: 'acct-1' }),
      filter: { accountId: 'acct-1' },
    });
    expect(seen).toEqual([null, 'acct-1']);
  });
});
