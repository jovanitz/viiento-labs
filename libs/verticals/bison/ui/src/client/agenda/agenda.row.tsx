/**
 * Agenda timeline building blocks — appointment row, status pill and the
 * per-row action menu. Presentational helpers of agenda.view.tsx (same
 * `(vm, actions)` discipline; no architecture).
 *
 * Only two statuses exist (confirmed | canceled), so confirmed — the norm —
 * shows no badge at all; the one exceptional state (canceled) gets the pill
 * and the strikethrough. Canceled rows lose the action menu: there is nothing
 * left to reschedule or cancel.
 */
import { MoreHorizontal } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@acme/ui';
import type { AgendaActions, AgendaVM, AppointmentRow } from './agenda.types';

type RowActions = Pick<
  AgendaActions,
  'onOpenAppointment' | 'onReschedule' | 'onCancelAppointment'
>;

const RowMenu = ({
  appt,
  onReschedule,
  onCancelAppointment,
}: {
  readonly appt: AppointmentRow;
} & Pick<AgendaActions, 'onReschedule' | 'onCancelAppointment'>) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Actions for ${appt.clientName}`}
      >
        <MoreHorizontal className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onReschedule(appt.id)}>
        Reschedule
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onClick={() => onCancelAppointment(appt.id)}
      >
        Cancel appointment
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const Row = ({
  appt,
  canSchedule,
  onOpenAppointment,
  onReschedule,
  onCancelAppointment,
}: {
  readonly appt: AppointmentRow;
  readonly canSchedule: boolean;
} & RowActions) => {
  const canceled = appt.status === 'canceled';
  return (
    <li className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
      <button
        type="button"
        onClick={() => onOpenAppointment(appt.id)}
        className="flex min-w-0 flex-1 items-center gap-4 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="w-12 shrink-0 text-right">
          <p className="text-sm font-medium tabular-nums text-foreground">
            {appt.start}
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {appt.end}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-sm font-medium text-foreground',
              canceled && 'text-muted-foreground line-through',
            )}
          >
            {appt.clientName}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {appt.service} · {appt.staffName}
          </p>
          {appt.note ? (
            <p className="truncate text-xs text-muted-foreground">
              {appt.note}
            </p>
          ) : null}
        </div>
      </button>
      {canceled ? (
        <Badge variant="secondary" appearance="soft" dot>
          Canceled
        </Badge>
      ) : null}
      {canSchedule && !canceled ? (
        <RowMenu
          appt={appt}
          onReschedule={onReschedule}
          onCancelAppointment={onCancelAppointment}
        />
      ) : null}
    </li>
  );
};

export const Timeline = ({
  vm,
  onOpenAppointment,
  onReschedule,
  onCancelAppointment,
}: { readonly vm: AgendaVM } & RowActions) => (
  <Card className="overflow-hidden">
    <ul className="divide-y divide-border">
      {vm.appointments.map((appt) => (
        <Row
          key={appt.id}
          appt={appt}
          canSchedule={vm.canSchedule}
          onOpenAppointment={onOpenAppointment}
          onReschedule={onReschedule}
          onCancelAppointment={onCancelAppointment}
        />
      ))}
    </ul>
  </Card>
);
