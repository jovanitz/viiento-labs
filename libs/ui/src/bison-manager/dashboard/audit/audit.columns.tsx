import type { ColumnDef } from '@tanstack/react-table';
import { Badge, type BadgeProps } from '../../../design-system/badge/badge';
import type { AuditRow } from './audit.types';

/** Friendly labels for the domain's append-only event codes (the real truth). */
const EVENT_LABEL: Record<string, string> = {
  'access.blocked': 'Access blocked',
  'access.unblocked': 'Access unblocked',
  'account.disabled': 'Account disabled',
  'account.enabled': 'Account enabled',
  'account.promoted': 'Promoted to staff',
  'account.demoted': 'Demoted from staff',
  'account.deletion-scheduled': 'Deletion scheduled',
  'account.deletion-canceled': 'Deletion canceled',
  'permissions.updated': 'Permissions updated',
  'member.roles-assigned': 'Roles assigned',
  'member.removed': 'Member removed',
  'invitation.created': 'Invitation sent',
  'invitation.accepted': 'Invitation accepted',
  'invitation.revoked': 'Invitation revoked',
  'identity.deleted': 'Identity deleted',
  'session.revoked': 'Session revoked',
  'session.switched': 'Organization switched',
  'grant.expired': 'Impersonation expired',
  'impersonation.started': 'Impersonation started',
  'impersonation.ended': 'Impersonation ended',
  'settings.updated': 'Session policy updated',
  'owner.bootstrapped': 'Owner bootstrapped',
  'login.succeeded': 'Signed in',
  'login.failed': 'Sign-in failed',
};
const labelOf = (t: string) => EVENT_LABEL[t] ?? t;

const NEGATIVE = [
  'blocked',
  'disabled',
  'deletion-scheduled',
  'revoked',
  'removed',
  'deleted',
  'demoted',
  'expired',
  'failed',
];
const POSITIVE = [
  'unblocked',
  'enabled',
  'deletion-canceled',
  'accepted',
  'promoted',
  'succeeded',
];
// POSITIVE is checked first on purpose: `access.unblocked` contains the
// substring `blocked`, so a NEGATIVE-first scan would tag a restorative action
// destructive. No destructive event code contains a POSITIVE keyword.
export const toneOf = (t: string): BadgeProps['variant'] => {
  if (POSITIVE.some((k) => t.includes(k))) return 'success';
  if (NEGATIVE.some((k) => t.includes(k))) return 'destructive';
  return 'secondary';
};

const EventCell = ({ row }: { readonly row: AuditRow }) => (
  <div className="flex flex-col gap-0.5">
    <Badge variant={toneOf(row.type)} appearance="soft" dot className="w-fit">
      {labelOf(row.type)}
    </Badge>
    <span className="font-mono text-[0.6875rem] text-muted-foreground">
      {row.type}
    </span>
  </div>
);

const TargetCell = ({
  row,
  onOpen,
}: {
  readonly row: AuditRow;
  readonly onOpen?: ((r: AuditRow) => void) | undefined;
}) => {
  const t = row.target;
  if (!t) return <span className="text-muted-foreground">—</span>;
  const body = (
    <>
      {t.label}{' '}
      <span className="text-xs text-muted-foreground">· {t.kind}</span>
    </>
  );
  if (!onOpen) return <span>{body}</span>;
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className="rounded-sm text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {body}
    </button>
  );
};

export const auditColumns = (
  onOpenTarget?: (row: AuditRow) => void,
): ColumnDef<AuditRow>[] => [
  {
    accessorKey: 'type',
    header: 'Event',
    enableSorting: false,
    cell: ({ row }) => <EventCell row={row.original} />,
  },
  {
    id: 'target',
    header: 'Target',
    accessorFn: (r) => r.target?.label ?? '',
    cell: ({ row }) => <TargetCell row={row.original} onOpen={onOpenTarget} />,
  },
  { id: 'by', header: 'By', accessorFn: (r) => r.actor ?? 'System' },
  {
    accessorKey: 'occurredAt',
    header: 'When',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.occurredAt}</span>
    ),
  },
];
