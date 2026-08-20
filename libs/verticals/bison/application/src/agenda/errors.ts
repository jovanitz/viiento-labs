import { defineError, type TaggedError } from '@acme/shared';
import type {
  AppointmentDomainError,
  ClientDomainError,
} from '@acme/bison-domain';

export const appointmentNotFound = defineError('app/appointment-not-found');

export type AgendaUseCaseError =
  | AppointmentDomainError
  | ClientDomainError
  | TaggedError<'app/appointment-not-found'>
  | TaggedError<'app/client-not-found'>;
