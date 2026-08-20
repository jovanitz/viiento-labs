import type { Appointment, AppointmentStatus } from '@acme/bison-domain';
import type { VisitSummary } from './ports';

/** The appointment as the UI (and the RPC edge) sees it — brands erased. */
export type AppointmentDto = {
  readonly id: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly service: string;
  readonly staffName: string;
  readonly date: string;
  readonly startMin: number;
  readonly durationMinutes: number;
  readonly status: AppointmentStatus;
  readonly note?: string | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export const toAppointmentDto = (appointment: Appointment): AppointmentDto => ({
  id: appointment.id,
  clientId: appointment.clientId,
  clientName: appointment.clientName,
  service: appointment.service,
  staffName: appointment.staffName,
  date: appointment.date,
  startMin: appointment.startMin,
  durationMinutes: appointment.durationMinutes,
  status: appointment.status,
  note: appointment.note,
  createdAt: appointment.createdAt,
  updatedAt: appointment.updatedAt,
});

export type VisitSummaryDto = {
  readonly clientId: string;
  readonly visitCount: number;
  readonly latestDate: string;
  readonly latestService: string;
};

export const toVisitSummaryDto = (summary: VisitSummary): VisitSummaryDto => ({
  clientId: summary.clientId,
  visitCount: summary.visitCount,
  latestDate: summary.latestDate,
  latestService: summary.latestService,
});
