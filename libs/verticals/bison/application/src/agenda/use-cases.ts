import {
  type Clock,
  type IdGenerator,
  type Logger,
  type Result,
  err,
  ok,
} from '@acme/shared';
import {
  bookAppointment,
  cancelAppointment,
  makeAppointmentId,
  makeClientId,
  rescheduleAppointment,
} from '@acme/bison-domain';
import type { AppointmentMove } from '@acme/bison-domain';
import { clientNotFound } from '../clients/errors';
import type { ClientRepository } from '../clients/ports';
import {
  type AppointmentDto,
  type VisitSummaryDto,
  toAppointmentDto,
  toVisitSummaryDto,
} from './dto';
import { type AgendaUseCaseError, appointmentNotFound } from './errors';
import type { AppointmentRepository } from './ports';

export type AgendaUseCaseDeps = {
  readonly appointments: AppointmentRepository;
  readonly clients: ClientRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly logger: Logger;
};

export type AgendaUseCaseResult = Promise<
  Result<AppointmentDto, AgendaUseCaseError>
>;

/** Book a slot for an existing roster client — `clientName` is denormalized
 *  from the record here, never taken from the caller. */
export const makeBookAppointment =
  (deps: AgendaUseCaseDeps) =>
  async (input: {
    readonly clientId: string;
    readonly service: string;
    readonly staffName?: string;
    readonly date: string;
    readonly startMin: number;
    readonly durationMinutes: number;
    readonly note?: string;
  }): AgendaUseCaseResult => {
    const clientId = makeClientId(input.clientId);
    if (!clientId.ok) return err(clientId.error);
    const client = await deps.clients.findById(clientId.value);
    if (!client) {
      return err(clientNotFound(`No client with id ${input.clientId}.`));
    }
    const id = makeAppointmentId(deps.ids.next());
    if (!id.ok) return err(id.error);

    const booked = bookAppointment({
      id: id.value,
      clientId: clientId.value,
      clientName: client.name,
      service: input.service,
      ...(input.staffName !== undefined ? { staffName: input.staffName } : {}),
      date: input.date,
      startMin: input.startMin,
      durationMinutes: input.durationMinutes,
      ...(input.note !== undefined ? { note: input.note } : {}),
      occurredAt: deps.clock.now().toISOString(),
    });
    if (!booked.ok) return err(booked.error);

    await deps.appointments.save(booked.value);
    deps.logger.info('bison.agenda.booked', {
      appointmentId: booked.value.id,
      clientId: clientId.value,
    });
    return ok(toAppointmentDto(booked.value));
  };

const loadAppointment = async (
  deps: AgendaUseCaseDeps,
  rawId: string,
): Promise<
  Result<
    NonNullable<Awaited<ReturnType<AppointmentRepository['findById']>>>,
    AgendaUseCaseError
  >
> => {
  const id = makeAppointmentId(rawId);
  if (!id.ok) return err(id.error);
  const appointment = await deps.appointments.findById(id.value);
  if (!appointment) {
    return err(appointmentNotFound(`No appointment with id ${rawId}.`));
  }
  return ok(appointment);
};

export const makeRescheduleAppointment =
  (deps: AgendaUseCaseDeps) =>
  async (input: {
    readonly id: string;
    readonly move: AppointmentMove;
  }): AgendaUseCaseResult => {
    const existing = await loadAppointment(deps, input.id);
    if (!existing.ok) return err(existing.error);

    const moved = rescheduleAppointment(
      existing.value,
      input.move,
      deps.clock.now().toISOString(),
    );
    if (!moved.ok) return err(moved.error);

    await deps.appointments.save(moved.value);
    return ok(toAppointmentDto(moved.value));
  };

export const makeCancelAppointment =
  (deps: AgendaUseCaseDeps) =>
  async (input: { readonly id: string }): AgendaUseCaseResult => {
    const existing = await loadAppointment(deps, input.id);
    if (!existing.ok) return err(existing.error);

    const canceled = cancelAppointment(
      existing.value,
      deps.clock.now().toISOString(),
    );
    if (!canceled.ok) return err(canceled.error);

    await deps.appointments.save(canceled.value);
    deps.logger.info('bison.agenda.canceled', {
      appointmentId: canceled.value.id,
    });
    return ok(toAppointmentDto(canceled.value));
  };

/** The date's appointments, by start time, canceled included. */
export const makeListDay =
  (deps: AgendaUseCaseDeps) =>
  async (input: {
    readonly date: string;
  }): Promise<ReadonlyArray<AppointmentDto>> => {
    const appointments = await deps.appointments.listByDay(input.date);
    return appointments.map(toAppointmentDto);
  };

/** The roster's visit facts — confirmed visits grouped per client. */
export const makeListVisitSummaries =
  (deps: AgendaUseCaseDeps) =>
  async (): Promise<ReadonlyArray<VisitSummaryDto>> => {
    const summaries = await deps.appointments.visitSummaries();
    return summaries.map(toVisitSummaryDto);
  };

export type AgendaUseCases = {
  readonly book: ReturnType<typeof makeBookAppointment>;
  readonly reschedule: ReturnType<typeof makeRescheduleAppointment>;
  readonly cancel: ReturnType<typeof makeCancelAppointment>;
  readonly listDay: ReturnType<typeof makeListDay>;
  readonly visits: ReturnType<typeof makeListVisitSummaries>;
};

export const makeAgendaUseCases = (
  deps: AgendaUseCaseDeps,
): AgendaUseCases => ({
  book: makeBookAppointment(deps),
  reschedule: makeRescheduleAppointment(deps),
  cancel: makeCancelAppointment(deps),
  listDay: makeListDay(deps),
  visits: makeListVisitSummaries(deps),
});
