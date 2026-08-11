/**
 * Pure derivation for the client-app prototype: the fixture days (see
 * client.prototype.days.ts) plus the click-through's local overrides
 * (reschedules, cancellations, blocks, bookings), so an edit made anywhere
 * in the click-through is visible on the agenda. Prototype-only plumbing —
 * the real app replaces all of this with stores + use cases.
 */
import type { AgendaVM, AppointmentRow } from '../agenda/agenda.types';
import type { ScheduleVM } from '../schedule/schedule.types';
import {
  resolveZones,
  type CalendarBlock,
} from '../schedule/blocks/blocks.logic';
import { todayVM } from '../agenda/agenda.fixtures';
import {
  DAY_END_MIN,
  DAY_START_MIN,
  hourMarks,
  toLabel,
  toMin,
} from '../schedule/schedule.time';
import { DAY_CHIPS, DAYS, dateAt } from './client.prototype.days';

export { DAYS, TODAY_IDX, dateAt } from './client.prototype.days';

export type Move = {
  readonly dayIdx: number;
  readonly startMin: number;
  readonly durationMinutes: number;
};

/** Booked via New-appointment — a fixture row with no home in `DAYS`. */
export type AddedAppointment = {
  readonly dayIdx: number;
  readonly row: AppointmentRow;
};

export type Overrides = {
  readonly moves: Readonly<Record<string, Move>>;
  readonly canceled: readonly string[];
  /** Calendar blocks (blocked time) created via the Block-time popover. */
  readonly blocks?: readonly CalendarBlock[];
  /** Appointments booked via the New-appointment dialog. */
  readonly added?: readonly AddedAppointment[];
};

/** Blocked time resolved onto a fixture day. */
export const zonesFor = (dayIdx: number, o: Overrides) =>
  resolveZones(o.blocks ?? [], dateAt(dayIdx));

export const findRow = (
  id: string,
  added: readonly AddedAppointment[] = [],
): { readonly row: AppointmentRow; readonly dayIdx: number } | null => {
  for (const [dayIdx, vm] of DAYS.entries()) {
    const row = vm.appointments.find((r) => r.id === id);
    if (row) return { row, dayIdx };
  }
  const hit = added.find((a) => a.row.id === id);
  return hit ? { row: hit.row, dayIdx: hit.dayIdx } : null;
};

/** Where the appointment currently sits, overrides applied — for the sheet's
 *  "Now …" line. */
export const currentLabel = (id: string, o: Overrides): string => {
  const hit = findRow(id, o.added ?? []);
  if (!hit) return '';
  const mv = o.moves[id];
  if (!mv)
    return `${DAYS[hit.dayIdx]?.dateLabel} · ${hit.row.start} – ${hit.row.end}`;
  const end = toLabel(mv.startMin + mv.durationMinutes);
  return `${DAYS[mv.dayIdx]?.dateLabel} · ${toLabel(mv.startMin)} – ${end}`;
};

const summarize = (rows: readonly AppointmentRow[]): string => {
  const canceled = rows.filter((r) => r.status === 'canceled').length;
  const plural = rows.length === 1 ? '' : 's';
  const canceledPart = canceled ? ` · ${canceled} canceled` : '';
  return `${rows.length} appointment${plural}${canceledPart}`;
};

/** The fixture day with the click-through's moves + cancellations applied.
 *  Untouched days pass through unchanged (keeping their flavor summaries). */
export const deriveDayVM = (dayIdx: number, o: Overrides): AgendaVM => {
  const base = DAYS[dayIdx] ?? todayVM;
  if (base.error || base.loading) return base;
  const added = o.added ?? [];
  const touched =
    base.appointments.some(
      (r) => o.moves[r.id] !== undefined || o.canceled.includes(r.id),
    ) ||
    Object.values(o.moves).some((mv) => mv.dayIdx === dayIdx) ||
    added.some((a) => a.dayIdx === dayIdx);
  if (!touched) return base;

  const movedIn = Object.entries(o.moves)
    .filter(([, mv]) => mv.dayIdx === dayIdx)
    .flatMap(([id, mv]) => {
      const hit = findRow(id, added);
      if (!hit) return [];
      return [
        {
          ...hit.row,
          start: toLabel(mv.startMin),
          end: toLabel(mv.startMin + mv.durationMinutes),
        },
      ];
    });
  const addedIn = added
    .filter((a) => a.dayIdx === dayIdx && o.moves[a.row.id] === undefined)
    .map((a) => a.row);
  const rows = base.appointments
    .filter((r) => o.moves[r.id] === undefined)
    .concat(movedIn, addedIn)
    .map((r) =>
      o.canceled.includes(r.id) ? { ...r, status: 'canceled' as const } : r,
    )
    .sort((a, b) => toMin(a.start) - toMin(b.start));
  return {
    ...base,
    appointments: rows,
    empty: rows.length === 0,
    summary: summarize(rows),
  };
};

/** The derived day lifted onto the Schedule grid (adds the hour scale +
 *  the date strip / calendar plumbing the grid-first view needs). */
export const deriveScheduleVM = (
  dayIdx: number,
  o: Overrides,
  bufferMinutes = 0,
): ScheduleVM => {
  const vm = deriveDayVM(dayIdx, o);
  return {
    bufferMinutes,
    zones: zonesFor(dayIdx, o),
    days: DAY_CHIPS.map((c) => ({ ...c, active: c.id === String(dayIdx) })),
    activeDate: dateAt(dayIdx),
    dateBounds: { from: dateAt(0), to: dateAt(DAYS.length - 1) },
    dateLabel: vm.dateLabel,
    isToday: vm.isToday,
    summary: vm.summary,
    appointments: vm.appointments,
    dayStartMin: DAY_START_MIN,
    dayEndMin: DAY_END_MIN,
    hours: hourMarks(),
    loading: vm.loading,
    empty: vm.empty,
    error: vm.error,
    canSchedule: vm.canSchedule,
  };
};
