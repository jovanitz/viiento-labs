import { type Result, err, ok } from '@acme/shared';
import type { AppointmentMove, AppointmentStatus } from '@acme/bison-domain';
import type { AppointmentDto } from '../../agenda/dto';
import type { BisonGatewayError } from '../../client/gateway';
import type { BisonClientFlowDeps } from './clients';

/**
 * The Agenda controller: one day's grid as a ViewModel — wall-clock labels
 * and the summary line preformatted here, never in a component. Commands
 * are thin: the domain (server-side) owns the rules; the Reorder modes
 * commit through `reschedule`, one move at a time.
 */
export type AppointmentRowVM = {
  readonly id: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly service: string;
  readonly staffName: string;
  readonly status: AppointmentStatus;
  readonly note?: string | undefined;
  readonly startMin: number;
  readonly durationMinutes: number;
  /** Preformatted — e.g. "9:00". */
  readonly start: string;
  readonly end: string;
};

export type AgendaDayVM = {
  readonly date: string;
  /** Preformatted — e.g. "Wed, Aug 20". */
  readonly dateLabel: string;
  readonly isToday: boolean;
  /** Preformatted — e.g. "3 appointments · 1 canceled". */
  readonly summary?: string | undefined;
  readonly appointments: ReadonlyArray<AppointmentRowVM>;
  readonly empty: boolean;
};

export const timeOfMinutes = (minutes: number): string =>
  `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;

/** Noon-anchored so the label can't shear into the neighbor day. */
export const labelOfDate = (date: string): string =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const toRowVM = (appointment: AppointmentDto): AppointmentRowVM => ({
  id: appointment.id,
  clientId: appointment.clientId,
  clientName: appointment.clientName,
  service: appointment.service,
  staffName: appointment.staffName,
  status: appointment.status,
  note: appointment.note,
  startMin: appointment.startMin,
  durationMinutes: appointment.durationMinutes,
  start: timeOfMinutes(appointment.startMin),
  end: timeOfMinutes(appointment.startMin + appointment.durationMinutes),
});

const summaryOf = (
  appointments: ReadonlyArray<AppointmentDto>,
): string | undefined => {
  if (appointments.length === 0) return undefined;
  const canceled = appointments.filter((a) => a.status === 'canceled').length;
  const plural = appointments.length === 1 ? '' : 's';
  const head = `${appointments.length} appointment${plural}`;
  return canceled > 0 ? `${head} · ${canceled} canceled` : head;
};

/** Query: one day's grid. `today` comes from the caller (controllers never
 *  read the clock), both as YYYY-MM-DD. */
export const loadAgendaDay = async (
  deps: BisonClientFlowDeps,
  input: { readonly date: string; readonly today: string },
): Promise<Result<AgendaDayVM, BisonGatewayError>> => {
  const listed = await deps.gateway.agenda.list({ date: input.date });
  if (!listed.ok) return err(listed.error);
  return ok({
    date: input.date,
    dateLabel: labelOfDate(input.date),
    isToday: input.date === input.today,
    summary: summaryOf(listed.value),
    appointments: listed.value.map(toRowVM),
    empty: listed.value.length === 0,
  });
};

export const bookAppointment = (
  deps: BisonClientFlowDeps,
  input: Parameters<BisonClientGatewayAgendaBook>[0],
): Promise<Result<AppointmentRowVM, BisonGatewayError>> =>
  deps.gateway.agenda
    .book(input)
    .then((result) => (result.ok ? ok(toRowVM(result.value)) : result));

type BisonClientGatewayAgendaBook =
  BisonClientFlowDeps['gateway']['agenda']['book'];

export const rescheduleAppointment = (
  deps: BisonClientFlowDeps,
  input: { readonly id: string; readonly move: AppointmentMove },
): Promise<Result<AppointmentRowVM, BisonGatewayError>> =>
  deps.gateway.agenda
    .reschedule(input)
    .then((result) => (result.ok ? ok(toRowVM(result.value)) : result));

export const cancelAppointment = (
  deps: BisonClientFlowDeps,
  input: { readonly id: string },
): Promise<Result<AppointmentRowVM, BisonGatewayError>> =>
  deps.gateway.agenda
    .cancel(input)
    .then((result) => (result.ok ? ok(toRowVM(result.value)) : result));

/* ---------- Blocked time (thin passthroughs — DTOs are already flat) --- */

export const loadCalendarBlocks = (deps: BisonClientFlowDeps) =>
  deps.gateway.agenda.blocks.list();

export const addCalendarBlock = (
  deps: BisonClientFlowDeps,
  input: Parameters<
    BisonClientFlowDeps['gateway']['agenda']['blocks']['add']
  >[0],
) => deps.gateway.agenda.blocks.add(input);

export const removeCalendarBlock = (
  deps: BisonClientFlowDeps,
  input: { readonly id: string },
) => deps.gateway.agenda.blocks.remove(input);
