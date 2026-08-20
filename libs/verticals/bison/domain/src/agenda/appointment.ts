import { type Brand, type Result, err, ok } from '@acme/shared';
import type { ClientId } from '../clients/client';
import {
  appointmentAlreadyCanceled,
  appointmentCanceled,
  invalidAppointment,
  invalidAppointmentId,
} from './errors';
import type { AppointmentDomainError } from './errors';

/**
 * The Appointment entity — one booked slot on the account's day grid.
 * Times are a calendar `date` (YYYY-MM-DD, the account's wall calendar —
 * never an instant, so timezones can't shear a booking across days) plus
 * minutes-of-day and a duration.
 *
 * An appointment is either on the books or off them — nothing in between
 * (owner's decision, 2026-08-03): `confirmed | canceled`. Rescheduling
 * MUTATES in place (the prototype's Reorder commits batches of moves);
 * overlaps are legal at the domain level — the schedule's Reorder modes
 * (free/strict/cascade) are UI policy, not a storage rule.
 *
 * `clientName` is denormalized from the roster at booking time so a day's
 * agenda renders without joins; `clientId` keeps the link to the record.
 */
export type AppointmentId = Brand<string, 'AppointmentId'>;

export const makeAppointmentId = (
  raw: string,
): Result<AppointmentId, AppointmentDomainError> => {
  const value = raw.trim();
  if (value.length === 0) {
    return err(invalidAppointmentId('Appointment id must not be empty.'));
  }
  return ok(value as AppointmentId);
};

export type AppointmentStatus = 'confirmed' | 'canceled';

export type Appointment = {
  readonly id: AppointmentId;
  readonly clientId: ClientId;
  readonly clientName: string;
  readonly service: string;
  /** Empty in the individual account — the owner is the only staff. */
  readonly staffName: string;
  /** YYYY-MM-DD on the account's wall calendar. */
  readonly date: string;
  readonly startMin: number;
  readonly durationMinutes: number;
  readonly status: AppointmentStatus;
  readonly note?: string | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MINUTES = 24 * 60;
const SERVICE_MAX = 120;

const slotProblems = (slot: {
  readonly date: string;
  readonly startMin: number;
  readonly durationMinutes: number;
}): readonly string[] => {
  const problems: string[] = [];
  if (!DATE_RE.test(slot.date)) {
    problems.push('date must be YYYY-MM-DD');
  }
  if (
    !Number.isInteger(slot.startMin) ||
    slot.startMin < 0 ||
    slot.startMin >= DAY_MINUTES
  ) {
    problems.push('startMin must be within the day');
  }
  if (
    !Number.isInteger(slot.durationMinutes) ||
    slot.durationMinutes <= 0 ||
    slot.startMin + slot.durationMinutes > DAY_MINUTES
  ) {
    problems.push('duration must be positive and end within the day');
  }
  return problems;
};

export const bookAppointment = (input: {
  readonly id: AppointmentId;
  readonly clientId: ClientId;
  readonly clientName: string;
  readonly service: string;
  readonly staffName?: string;
  readonly date: string;
  readonly startMin: number;
  readonly durationMinutes: number;
  readonly note?: string;
  readonly occurredAt: string;
}): Result<Appointment, AppointmentDomainError> => {
  const problems = [...slotProblems(input)];
  if (input.clientName.trim().length === 0) {
    problems.push('clientName must not be empty');
  }
  // Service is OPTIONAL at booking time (owner's decision 2026-08-11: the
  // dialog has no service field) — empty is a legal, honest value.
  const service = input.service.trim();
  if (service.length > SERVICE_MAX) {
    problems.push(`service must be at most ${SERVICE_MAX} characters`);
  }
  if (problems.length > 0) {
    return err(
      invalidAppointment('The booking is invalid.', {
        details: { problems },
      }),
    );
  }
  return ok({
    id: input.id,
    clientId: input.clientId,
    clientName: input.clientName.trim(),
    service,
    staffName: (input.staffName ?? '').trim(),
    date: input.date,
    startMin: input.startMin,
    durationMinutes: input.durationMinutes,
    status: 'confirmed',
    note: input.note?.trim() || undefined,
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });
};

export type AppointmentMove = {
  readonly date?: string;
  readonly startMin?: number;
  readonly durationMinutes?: number;
};

/** Reschedule in place — a canceled appointment is off the books and
 *  cannot be moved (re-book instead). */
export const rescheduleAppointment = (
  appointment: Appointment,
  move: AppointmentMove,
  occurredAt: string,
): Result<Appointment, AppointmentDomainError> => {
  if (appointment.status === 'canceled') {
    return err(
      appointmentCanceled(`Appointment ${appointment.id} is canceled.`),
    );
  }
  const next = {
    date: move.date ?? appointment.date,
    startMin: move.startMin ?? appointment.startMin,
    durationMinutes: move.durationMinutes ?? appointment.durationMinutes,
  };
  const problems = slotProblems(next);
  if (problems.length > 0) {
    return err(
      invalidAppointment('The new slot is invalid.', {
        details: { problems },
      }),
    );
  }
  return ok({ ...appointment, ...next, updatedAt: occurredAt });
};

export const cancelAppointment = (
  appointment: Appointment,
  occurredAt: string,
): Result<Appointment, AppointmentDomainError> => {
  if (appointment.status === 'canceled') {
    return err(
      appointmentAlreadyCanceled(
        `Appointment ${appointment.id} is already canceled.`,
      ),
    );
  }
  return ok({ ...appointment, status: 'canceled', updatedAt: occurredAt });
};
