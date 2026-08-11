/**
 * Fixture ViewModels for the Schedule screen — the agenda fixture days lifted
 * onto the day grid (same rows, plus the grid's hour scale). Data only.
 */
import type { AgendaVM } from '../agenda/agenda.types';
import {
  errorVM as agendaError,
  freeDayVM as agendaFree,
  loadingVM as agendaLoading,
  todayVM as agendaToday,
  tomorrowVM as agendaTomorrow,
} from '../agenda/agenda.fixtures';
import { DAY_END_MIN, DAY_START_MIN, hourMarks } from './schedule.time';
import type { ScheduleVM } from './schedule.types';

/** The fixture week as date-strip chips; `active` marks the shown day. */
const chips = (activeLabel: string) =>
  [
    { id: '0', weekday: 'Sun', day: '2', label: 'Sun, Aug 2' },
    { id: '1', weekday: 'Mon', day: '3', label: 'Mon, Aug 3' },
    { id: '2', weekday: 'Tue', day: '4', label: 'Tue, Aug 4' },
    { id: '3', weekday: 'Wed', day: '5', label: 'Wed, Aug 5' },
    { id: '4', weekday: 'Thu', day: '6', label: 'Thu, Aug 6' },
  ].map(({ label, ...chip }) => ({
    ...chip,
    isToday: label === 'Mon, Aug 3',
    active: label === activeLabel,
  }));

/** Fixture week bounds — Sun Aug 2 → Thu Aug 6, 2026 (matches the chip
 *  labels above). These standalone stories don't exercise the prototype's
 *  wider fixture window; the Block-time calendar just needs real dates. */
const WEEK_START = new Date(2026, 7, 2);
const WEEK_END = new Date(2026, 7, 6);
const dateForLabel = (label: string): Date => {
  const day = Number(label.split(' ').at(-1));
  return new Date(2026, 7, day);
};

const onGrid = (vm: AgendaVM): ScheduleVM => ({
  bufferMinutes: 0,
  zones: [],
  days: chips(vm.dateLabel),
  activeDate: dateForLabel(vm.dateLabel),
  dateBounds: { from: WEEK_START, to: WEEK_END },
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
});

export const todayVM = onGrid(agendaToday);
export const tomorrowVM = onGrid(agendaTomorrow);
export const freeDayVM = onGrid(agendaFree);
export const errorVM = onGrid(agendaError);
export const loadingVM = onGrid(agendaLoading);

/** A staff member without scheduling capability — view-only grid. */
export const readOnlyVM: ScheduleVM = { ...todayVM, canSchedule: false };

/** A 30-min required gap between appointments — striped zones on the grid. */
export const bufferedVM: ScheduleVM = { ...todayVM, bufferMinutes: 30 };

/** Today with blocked time: a one-off lunch block and a recurring daily
 *  reservation ("School run" 16:45–17:30). */
export const blockedVM: ScheduleVM = {
  ...todayVM,
  zones: [
    {
      id: 'blk-1',
      label: 'Lunch',
      startMin: 12 * 60 + 15,
      endMin: 13 * 60,
      recurring: false,
    },
    {
      id: 'blk-2',
      label: 'School run',
      startMin: 16 * 60 + 45,
      endMin: 17 * 60 + 30,
      recurring: true,
    },
  ],
};
