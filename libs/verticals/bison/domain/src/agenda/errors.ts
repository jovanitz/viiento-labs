import { defineError, type TaggedError } from '@acme/shared';

export const invalidAppointmentId = defineError(
  'domain/invalid-appointment-id',
);
/** One error for the whole booking — `details.problems` lists every
 *  violation, so the dialog can mark all of them in a single pass. */
export const invalidAppointment = defineError('domain/invalid-appointment');
export const appointmentCanceled = defineError('domain/appointment-canceled');
export const appointmentAlreadyCanceled = defineError(
  'domain/appointment-already-canceled',
);

export const invalidCalendarBlockId = defineError(
  'domain/invalid-calendar-block-id',
);
export const invalidCalendarBlock = defineError(
  'domain/invalid-calendar-block',
);

export type AppointmentDomainError =
  | TaggedError<'domain/invalid-appointment-id'>
  | TaggedError<'domain/invalid-appointment'>
  | TaggedError<'domain/appointment-canceled'>
  | TaggedError<'domain/appointment-already-canceled'>
  | TaggedError<'domain/invalid-calendar-block-id'>
  | TaggedError<'domain/invalid-calendar-block'>;
