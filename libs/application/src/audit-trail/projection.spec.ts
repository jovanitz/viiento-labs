import { describe, expect, it } from 'vitest';
import type { AccessAuditEvent } from '@acme/domain';
import type { AccessAuditRecord, AuditLabels } from './ports';
import { collectAuditRefs, projectAuditEvent } from './projection';

const NOW = '2026-07-24T12:00:00.000Z';

const rec = (event: AccessAuditEvent): AccessAuditRecord => ({
  id: `a-${event.type}`,
  event,
});

const labels = (over: Partial<AuditLabels> = {}): AuditLabels => ({
  memberships: new Map([
    [
      'mem-support',
      {
        label: 'support@acme.test',
        accountId: 'acc-staff',
        accountName: 'Acme Staff',
        kind: 'staff',
      },
    ],
    [
      'mem-cust',
      {
        label: 'ana@clinica.test',
        accountId: 'acc-cust',
        accountName: 'Clínica Norte',
        kind: 'customer',
      },
    ],
  ]),
  accounts: new Map([
    ['acc-cust', { name: 'Clínica Norte', kind: 'customer' }],
    ['acc-staff', { name: 'Acme Staff', kind: 'staff' }],
  ]),
  users: new Map([['user-9', { email: 'ghost@acme.test' }]]),
  sessions: new Map([['sess-1', { membershipId: 'mem-support' }]]),
  ...over,
});

describe('projectAuditEvent', () => {
  it('resolves actor membership to its label; org target gets the account name', () => {
    const view = projectAuditEvent(
      rec({
        type: 'account.disabled',
        accountId: 'acc-cust',
        actorMembershipId: 'mem-support',
        reason: null,
        occurredAt: NOW,
      }),
      labels(),
    );
    expect(view.actor).toBe('support@acme.test');
    expect(view.category).toBe('access');
    expect(view.target).toEqual({
      kind: 'org',
      id: 'acc-cust',
      label: 'Clínica Norte',
    });
  });

  it('roles-assigned lands under roles; membership target keeps the org link', () => {
    const view = projectAuditEvent(
      rec({
        type: 'member.roles-assigned',
        membershipId: 'mem-cust',
        actorMembershipId: 'mem-support',
        roleIds: [],
        occurredAt: NOW,
      }),
      labels(),
    );
    expect(view.category).toBe('roles');
    expect(view.target).toEqual({
      kind: 'org',
      id: 'mem-cust',
      label: 'ana@clinica.test',
    });
  });

  it('a blocked staff membership resolves to a staff target', () => {
    const view = projectAuditEvent(
      rec({
        type: 'access.blocked',
        subjectKind: 'membership',
        subjectId: 'mem-support',
        actorMembershipId: 'mem-support',
        reason: 'abuse',
        occurredAt: NOW,
      }),
      labels(),
    );
    expect(view.target?.kind).toBe('staff');
    expect(view.target?.label).toBe('support@acme.test');
  });

  it('invitation targets the email verbatim (no lookup needed)', () => {
    const view = projectAuditEvent(
      rec({
        type: 'invitation.created',
        invitationId: 'inv-1',
        accountId: 'acc-cust',
        email: 'new@clinica.test',
        permissions: [],
        roleIds: [],
        actorMembershipId: 'mem-support',
        expiresAt: NOW,
        occurredAt: NOW,
      }),
      labels(),
    );
    expect(view.category).toBe('invites');
    expect(view.target).toEqual({
      kind: 'identity',
      id: 'new@clinica.test',
      label: 'new@clinica.test',
    });
  });

  it('a revoked session resolves through to the member it belonged to', () => {
    const view = projectAuditEvent(
      rec({
        type: 'session.revoked',
        sessionId: 'sess-1',
        actorMembershipId: 'mem-support',
        occurredAt: NOW,
      }),
      labels(),
    );
    expect(view.category).toBe('sessions');
    expect(view.target).toEqual({
      kind: 'staff',
      id: 'sess-1',
      label: 'support@acme.test',
    });
  });

  it('system events (login) have no actor; settings has no target', () => {
    const login = projectAuditEvent(
      rec({
        type: 'login.succeeded',
        userId: 'user-9',
        sessionId: 'sess-1',
        occurredAt: NOW,
      }),
      labels(),
    );
    expect(login.actor).toBeNull();
    expect(login.target).toEqual({
      kind: 'identity',
      id: 'user-9',
      label: 'ghost@acme.test',
    });

    const settings = projectAuditEvent(
      rec({
        type: 'settings.updated',
        actorMembershipId: 'mem-support',
        before: {} as never,
        after: {} as never,
        occurredAt: NOW,
      }),
      labels(),
    );
    expect(settings.target).toBeNull();
  });

  it('falls back to the raw id when a label is missing', () => {
    const view = projectAuditEvent(
      rec({
        type: 'account.disabled',
        accountId: 'acc-unknown',
        actorMembershipId: 'mem-unknown',
        reason: null,
        occurredAt: NOW,
      }),
      labels(),
    );
    expect(view.actor).toBe('mem-unknown');
    expect(view.target?.label).toBe('acc-unknown');
  });
});

describe('collectAuditRefs', () => {
  it('de-duplicates ids and routes each to its bucket', () => {
    const refs = collectAuditRefs([
      rec({
        type: 'account.disabled',
        accountId: 'acc-cust',
        actorMembershipId: 'mem-support',
        reason: null,
        occurredAt: NOW,
      }),
      rec({
        type: 'session.revoked',
        sessionId: 'sess-1',
        actorMembershipId: 'mem-support',
        occurredAt: NOW,
      }),
      rec({
        type: 'invitation.revoked',
        invitationId: 'inv-1',
        accountId: 'acc-cust',
        email: 'x@y.test',
        actorMembershipId: 'mem-support',
        occurredAt: NOW,
      }),
    ]);
    expect(refs.memberships).toEqual(['mem-support']); // actor, de-duped
    expect(refs.accounts).toEqual(['acc-cust']);
    expect(refs.sessions).toEqual(['sess-1']);
    expect(refs.users).toEqual([]); // email targets need no resolution
  });
});
