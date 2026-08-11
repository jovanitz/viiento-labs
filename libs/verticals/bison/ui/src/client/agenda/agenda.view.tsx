/**
 * Bison Manager · Client · Agenda — the business's day at a glance: one date's
 * appointment timeline with day navigation, per-appointment status, and the
 * "new appointment" entry point.
 *
 * @screen Bison Manager / Client / Agenda
 * @phase draft
 *
 * Presentational: a pure function of (ViewModel + actions). `loading`, `empty`,
 * `error`, `canSchedule`, the date label and the summary line are DATA on the
 * VM — the view renders state, it never computes it.
 */
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  EmptyState,
  Skeleton,
  Stack,
} from '@acme/ui';
import { Timeline } from './agenda.row';
import type { AgendaActions, AgendaVM } from './agenda.types';

const NewAppointmentButton = ({
  onNewAppointment,
}: Pick<AgendaActions, 'onNewAppointment'>) => (
  <Button onClick={onNewAppointment}>
    <CalendarPlus className="mr-2 size-4" />
    New appointment
  </Button>
);

const DayPager = ({
  vm,
  onPrevDay,
  onNextDay,
  onToday,
}: { readonly vm: AgendaVM } & Pick<
  AgendaActions,
  'onPrevDay' | 'onNextDay' | 'onToday'
>) => (
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      size="icon"
      onClick={onPrevDay}
      aria-label="Previous day"
    >
      <ChevronLeft className="size-4" />
    </Button>
    <Button
      variant="outline"
      size="icon"
      onClick={onNextDay}
      aria-label="Next day"
    >
      <ChevronRight className="size-4" />
    </Button>
    <p className="pl-1 text-sm font-medium text-foreground">{vm.dateLabel}</p>
    {vm.isToday ? (
      <Badge variant="secondary" appearance="soft">
        Today
      </Badge>
    ) : (
      <Button variant="ghost" size="sm" onClick={onToday}>
        Today
      </Button>
    )}
  </div>
);

const Body = ({
  vm,
  onNewAppointment,
  onOpenAppointment,
  onReschedule,
  onCancelAppointment,
  onRetry,
}: { readonly vm: AgendaVM } & Pick<
  AgendaActions,
  | 'onNewAppointment'
  | 'onOpenAppointment'
  | 'onReschedule'
  | 'onCancelAppointment'
  | 'onRetry'
>) => {
  if (vm.loading)
    return (
      <Stack gap="cozy">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </Stack>
    );
  if (vm.error)
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&rsquo;t load the agenda</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          {vm.error}
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  if (vm.empty)
    return (
      <EmptyState
        icon={<CalendarDays />}
        title={vm.isToday ? 'Nothing booked today' : 'Nothing booked'}
        description="Appointments for this day will show up here as they are scheduled."
        action={
          vm.canSchedule ? (
            <NewAppointmentButton onNewAppointment={onNewAppointment} />
          ) : undefined
        }
      />
    );
  return (
    <Timeline
      vm={vm}
      onOpenAppointment={onOpenAppointment}
      onReschedule={onReschedule}
      onCancelAppointment={onCancelAppointment}
    />
  );
};

export const AgendaView = ({
  vm,
  onPrevDay,
  onNextDay,
  onToday,
  onNewAppointment,
  onOpenAppointment,
  onReschedule,
  onCancelAppointment,
  onRetry,
}: { readonly vm: AgendaVM } & AgendaActions) => (
  <Stack gap="group" className="max-w-3xl">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Agenda</h1>
        {vm.summary ? (
          <p className="text-sm text-muted-foreground">{vm.summary}</p>
        ) : null}
      </div>
      {vm.canSchedule ? (
        <NewAppointmentButton onNewAppointment={onNewAppointment} />
      ) : null}
    </div>
    <DayPager
      vm={vm}
      onPrevDay={onPrevDay}
      onNextDay={onNextDay}
      onToday={onToday}
    />
    <Body
      vm={vm}
      onNewAppointment={onNewAppointment}
      onOpenAppointment={onOpenAppointment}
      onReschedule={onReschedule}
      onCancelAppointment={onCancelAppointment}
      onRetry={onRetry}
    />
  </Stack>
);
