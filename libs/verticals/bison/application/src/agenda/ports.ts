import type {
  Appointment,
  AppointmentId,
  CalendarBlock,
  CalendarBlockId,
  ClientId,
} from '@acme/bison-domain';

/** Confirmed-visit facts per client — what the roster shows ("N visits ·
 *  latest"). Derived by the adapter (a GROUP BY, not N queries). */
export type VisitSummary = {
  readonly clientId: ClientId;
  readonly visitCount: number;
  /** YYYY-MM-DD of the most recent confirmed visit. */
  readonly latestDate: string;
  readonly latestService: string;
};

/**
 * Repository port for the day grid. `listByDay` returns the date's
 * appointments ordered by start time (canceled ones included — the agenda
 * shows them struck through, they are history, not noise).
 */
export type AppointmentRepository = {
  readonly findById: (id: AppointmentId) => Promise<Appointment | null>;
  readonly listByDay: (date: string) => Promise<ReadonlyArray<Appointment>>;
  readonly save: (appointment: Appointment) => Promise<void>;
  readonly visitSummaries: () => Promise<ReadonlyArray<VisitSummary>>;
};

/**
 * Repository port for blocked time. An account holds FEW blocks, so `list`
 * returns them all and per-day resolution stays a pure function at the
 * edge. `remove` deletes a block (a recurring one goes with its whole
 * series) and is idempotent.
 */
export type CalendarBlockRepository = {
  readonly list: () => Promise<ReadonlyArray<CalendarBlock>>;
  readonly save: (block: CalendarBlock) => Promise<void>;
  readonly remove: (id: CalendarBlockId) => Promise<void>;
};
