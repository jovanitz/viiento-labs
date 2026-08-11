/**
 * ViewModel + action contracts for the Schedule screen — the graphical,
 * grid-first agenda (the day timeline as the main view) with a Reorder mode:
 * free (overlaps allowed), strict (only free slots) and cascade (moving one
 * appointment shifts the others). Reordering is a local draft; `onApply`
 * commits the batch.
 */
import type { AppointmentRow } from '../agenda/agenda.types';

export type ReorderMode = 'free' | 'strict' | 'cascade';

/** How cascade propagates: shift every later appointment by the same delta,
 *  or push only the colliding chain (gaps absorb the shove). Both are
 *  prototyped so the click-through can compare them. */
export type CascadeVariant = 'shift-all' | 'push-chain';

/** A block on the day grid. Appointments drag in reorder mode; `zone` is a
 *  calendar block (blocked time) — a wall the rules collide with but that
 *  never moves or enters the draft. */
export type ScheduleBlock = {
  readonly id: string;
  readonly kind: 'appointment' | 'zone';
  readonly startMin: number;
  readonly durationMinutes: number;
  readonly clientName: string;
  readonly service: string;
  readonly staffName: string;
};

/** One committed reorder edit (position and/or duration). */
export type ScheduleChange = {
  readonly id: string;
  readonly startMin: number;
  readonly durationMinutes: number;
};

/** Where a "Block time" block applies — always an explicit, self-describing
 *  choice, never implied by whatever day the grid happens to be showing:
 *  a concrete date range (a single day when start=end, or a run of days —
 *  vacation), or a recurring weekly pattern (every day / specific weekdays,
 *  0 = Sunday) that has no end date. */
export type NewCalendarBlockDates =
  | { readonly kind: 'range'; readonly start: Date; readonly end: Date }
  | {
      readonly kind: 'recurring';
      readonly pattern: 'daily' | readonly number[];
    };

/** What the Block-time popover submits (Calendly-style "date override"). */
export type NewCalendarBlock = {
  readonly label: string;
  readonly allDay: boolean;
  readonly startMin: number;
  readonly endMin: number;
  readonly dates: NewCalendarBlockDates;
};

/** What the New-appointment dialog submits — always on the day the grid is
 *  currently showing (no date picker: the dialog opens from that context, a
 *  click on an empty grid slot). */
export type NewAppointment = {
  readonly clientName: string;
  readonly service: string;
  readonly staffName: string;
  readonly startMin: number;
  readonly durationMinutes: number;
};

/** One chip of the scrollable date strip. Labels are preformatted; a chip
 *  carries a month label only where the month rolls over, so scrolling
 *  across a boundary (e.g. Aug → Sep) is never ambiguous. */
export type DayChip = {
  readonly id: string;
  /** e.g. "Mon". */
  readonly weekday: string;
  /** e.g. "3". */
  readonly day: string;
  readonly isToday: boolean;
  /** The day currently displayed on the grid. */
  readonly active: boolean;
  readonly monthLabel?: string | undefined;
};

/** A calendar block resolved onto the displayed day, ready to render. */
export type DayZone = {
  readonly id: string;
  readonly label: string;
  readonly startMin: number;
  readonly endMin: number;
  readonly recurring: boolean;
};

export type ScheduleVM = {
  /** Required minutes BETWEEN client appointments (travel, cleanup) — a
   *  business policy every rule set except Free must respect. Breaks need no
   *  buffer around them: they already are dead time. 0 = none. */
  readonly bufferMinutes: number;
  /** Preformatted — e.g. "Mon, Aug 3". */
  readonly dateLabel: string;
  readonly isToday: boolean;
  /** The scrollable date strip (past + future days; today flagged). */
  readonly days: readonly DayChip[];
  /** The real date the grid is showing — the Block-time popover's calendar
   *  anchors/defaults its selection to it; the grid itself never computes
   *  from it. */
  readonly activeDate: Date;
  /** Earliest/latest day this prototype's fixture window can show — bounds
   *  the Block-time calendar so a pick always lands on a real, navigable day. */
  readonly dateBounds: { readonly from: Date; readonly to: Date };
  /** Preformatted headline — e.g. "8 appointments · 2 canceled". */
  readonly summary?: string | undefined;
  readonly appointments: readonly AppointmentRow[];
  /** Blocked time resolved for this day (one-off and recurring), sorted. */
  readonly zones: readonly DayZone[];
  readonly dayStartMin: number;
  readonly dayEndMin: number;
  readonly hours: ReadonlyArray<{
    readonly min: number;
    readonly label: string;
  }>;
  readonly loading: boolean;
  readonly empty: boolean;
  readonly error?: string | undefined;
  readonly canSchedule: boolean;
};

export type ScheduleActions = {
  /** Picks a day from the date strip. */
  readonly onSelectDay: (id: string) => void;
  /** Books a new appointment on the day currently shown. */
  readonly onCreateAppointment: (appointment: NewAppointment) => void;
  readonly onCancelAppointment: (id: string) => void;
  /** Creates a calendar block from the Block-time popover. */
  readonly onBlockTime: (block: NewCalendarBlock) => void;
  /** Deletes a calendar block (a recurring one goes with its whole series). */
  readonly onRemoveBlock: (id: string) => void;
  /** Changes the required-gap policy (prototype knob; Settings later). */
  readonly onBufferChange: (minutes: number) => void;
  /** Commit the reorder draft — every block whose time or length changed. */
  readonly onApply: (changes: readonly ScheduleChange[]) => void;
  readonly onRetry: () => void;
};
