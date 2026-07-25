import type { Meta, StoryObj } from '@storybook/react';
import { AuditView, type AuditRow } from './audit.view';
import { DashboardShell } from '../dashboard.shell';

const entries: readonly AuditRow[] = [
  {
    id: '1',
    type: 'account.deletion-scheduled',
    category: 'access',
    actor: 'ana@acme.com',
    target: { label: 'Óptica Vista', kind: 'org', id: 'org_16' },
    occurredAt: '2026-07-13 18:04 UTC',
  },
  {
    id: '2',
    type: 'account.demoted',
    category: 'access',
    actor: 'ana@acme.com',
    target: { label: 'cami@acme.com', kind: 'staff', id: 'acc_03' },
    occurredAt: '2026-07-12 09:41 UTC',
  },
  // system-triggered event → no actor (renders "System")
  {
    id: '3',
    type: 'access.blocked',
    category: 'access',
    target: { label: 'Hospital Río', kind: 'org', id: 'org_13' },
    occurredAt: '2026-07-11 16:30 UTC',
  },
  {
    id: '4',
    type: 'invitation.created',
    category: 'invites',
    actor: 'ana@acme.com',
    target: { label: 'nuevo@norte.mx', kind: 'identity' },
    occurredAt: '2026-07-09 15:10 UTC',
  },
  {
    id: '5',
    type: 'member.roles-assigned',
    category: 'roles',
    actor: 'beto@acme.com',
    target: { label: 'ana@acme.com', kind: 'staff', id: 'acc_02' },
    occurredAt: '2026-07-08 17:52 UTC',
  },
  {
    id: '6',
    type: 'session.revoked',
    category: 'sessions',
    actor: 'ana@acme.com',
    target: { label: 'ana@acme.com', kind: 'staff', id: 'acc_01' },
    occurredAt: '2026-07-08 08:12 UTC',
  },
];

const meta: Meta<typeof AuditView> = {
  title: 'Medicine Manager/Dashboard/Audit',
  component: AuditView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof AuditView>;

const inShell = (vm: Parameters<typeof AuditView>[0]['vm']) =>
  function Render() {
    return (
      <DashboardShell active="Audit">
        <AuditView vm={vm} onOpenTarget={() => undefined} />
      </DashboardShell>
    );
  };

export const Populated: Story = { render: inShell({ entries }) };
export const Loading: Story = {
  render: inShell({ entries: [], loading: true }),
};
export const Empty: Story = { render: inShell({ entries: [] }) };
export const Hidden: Story = {
  render: inShell({ entries: [], hidden: true }),
};
export const LoadError: Story = {
  render: inShell({ entries: [], error: 'Could not load the audit trail.' }),
};
