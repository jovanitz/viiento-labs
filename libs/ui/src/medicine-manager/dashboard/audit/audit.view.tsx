/**
 * Medicine Manager · Dashboard · Audit trail — read-only, append-only record of
 * sensitive events (access, billing, invites, roles, sessions). Each row reads
 * as a toned event + the entity it touched (Target), which links back to that
 * org/staff. A category chip bar + the table search narrow the log. All fields
 * (category, actor, target labels) are resolved server-side; the view renders.
 *
 * @screen Medicine Manager / Dashboard / Audit
 * @phase approved
 */
import { useMemo, useState } from 'react';
import { Toggle } from '../../../design-system/toggle/toggle';
import { DataTable } from '../../../design-system/data-table/data-table';
import { EmptyState } from '../../../design-system/empty/empty-state';
import { Alert, AlertDescription } from '../../../design-system/alert/alert';
import { Skeleton } from '../../../design-system/skeleton/skeleton';
import { auditColumns } from './audit.columns';
import type { AuditActions, AuditCategory, AuditVM } from './audit.types';

export type {
  AuditActions,
  AuditCategory,
  AuditRow,
  AuditTarget,
  AuditVM,
} from './audit.types';

const CATEGORIES: readonly {
  readonly key: AuditCategory;
  readonly label: string;
}[] = [
  { key: 'access', label: 'Access' },
  { key: 'billing', label: 'Billing' },
  { key: 'invites', label: 'Invites' },
  { key: 'roles', label: 'Roles' },
  { key: 'sessions', label: 'Sessions' },
];
const CHIP =
  'h-7 shrink-0 rounded-full px-3 text-xs data-[state=on]:border-primary/40 data-[state=on]:bg-primary/10 data-[state=on]:text-foreground';

const CategoryBar = ({
  active,
  setActive,
  available,
}: {
  readonly active: AuditCategory | null;
  readonly setActive: (c: AuditCategory | null) => void;
  readonly available: ReadonlySet<AuditCategory>;
}) => (
  <div className="flex flex-wrap items-center gap-2">
    {CATEGORIES.filter((c) => available.has(c.key)).map((c) => (
      <Toggle
        key={c.key}
        size="sm"
        variant="outline"
        pressed={active === c.key}
        onPressedChange={(on) => setActive(on ? c.key : null)}
        className={CHIP}
      >
        {c.label}
      </Toggle>
    ))}
  </div>
);

const Header = () => (
  <div>
    <h1 className="text-xl font-semibold text-foreground">Audit trail</h1>
    <p className="text-sm text-muted-foreground">
      Append-only record of sensitive events (most recent first).
    </p>
  </div>
);

const AuditBody = ({
  vm,
  onOpenTarget,
}: { readonly vm: AuditVM } & AuditActions) => {
  const [active, setActive] = useState<AuditCategory | null>(null);
  const available = useMemo(
    () => new Set(vm.entries.map((e) => e.category)),
    [vm.entries],
  );
  const rows = useMemo(
    () =>
      active ? vm.entries.filter((e) => e.category === active) : vm.entries,
    [vm.entries, active],
  );
  if (vm.entries.length === 0)
    return (
      <EmptyState
        title="No events yet"
        description="Security events will show up here."
      />
    );
  return (
    <>
      <CategoryBar
        active={active}
        setActive={setActive}
        available={available}
      />
      <DataTable
        columns={auditColumns(onOpenTarget)}
        data={rows}
        searchPlaceholder="Search events…"
      />
    </>
  );
};

const AuditContent = ({
  vm,
  onOpenTarget,
}: { readonly vm: AuditVM } & AuditActions) => {
  if (vm.hidden)
    return (
      <EmptyState
        title="Not available"
        description="You don’t have permission to read the audit trail."
      />
    );
  if (vm.loading)
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  return <AuditBody vm={vm} onOpenTarget={onOpenTarget} />;
};

export const AuditView = ({
  vm,
  onOpenTarget,
}: { readonly vm: AuditVM } & AuditActions) => (
  <div className="flex flex-col gap-3">
    <Header />
    {vm.error ? (
      <Alert variant="destructive">
        <AlertDescription>{vm.error}</AlertDescription>
      </Alert>
    ) : null}
    <AuditContent vm={vm} onOpenTarget={onOpenTarget} />
  </div>
);
