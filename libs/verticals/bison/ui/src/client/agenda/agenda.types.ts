/**
 * ViewModel + action contracts for the client Agenda screen. The view renders
 * these — it never computes them: date labels, the summary line, `empty` and
 * `canSchedule` all arrive as data (docs/ai/screens.md).
 */

/** An appointment is either on the books or off them — nothing in between
 *  (product decision 2026-08-03). */
export type AppointmentStatus = 'confirmed' | 'canceled';

export type AppointmentRow = {
  readonly id: string;
  /** Wall-clock labels, preformatted — e.g. "09:00". */
  readonly start: string;
  readonly end: string;
  readonly clientName: string;
  readonly service: string;
  readonly staffName: string;
  readonly status: AppointmentStatus;
  readonly note?: string | undefined;
};

export type AgendaVM = {
  /** Preformatted — e.g. "Mon, Aug 3". */
  readonly dateLabel: string;
  readonly isToday: boolean;
  /** Preformatted headline — e.g. "8 appointments · 2 canceled". */
  readonly summary?: string | undefined;
  readonly appointments: readonly AppointmentRow[];
  readonly loading: boolean;
  readonly empty: boolean;
  readonly error?: string | undefined;
  readonly canSchedule: boolean;
};

export type AgendaActions = {
  readonly onPrevDay: () => void;
  readonly onNextDay: () => void;
  readonly onToday: () => void;
  readonly onNewAppointment: () => void;
  readonly onOpenAppointment: (id: string) => void;
  /** Opens the reschedule flow (gap picker) for the appointment. */
  readonly onReschedule: (id: string) => void;
  readonly onCancelAppointment: (id: string) => void;
  readonly onRetry: () => void;
};
