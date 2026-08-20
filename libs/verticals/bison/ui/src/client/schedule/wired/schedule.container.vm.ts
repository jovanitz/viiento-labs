import type { AgendaDayVM, CalendarBlockDto } from '@acme/bison-application';
import { localDate } from '../../store/agenda-store';
import type { DayChip, ScheduleVM } from '../schedule.types';
import { resolveZones, type CalendarBlock } from '../blocks/blocks.logic';
import { DAY_END_MIN, DAY_START_MIN, hourMarks } from '../schedule.time';

/**
 * Pure ViewModel assembly for the wired Schedule: real date chips around
 * today, the backend day, and the persisted blocks resolved onto it.
 */
const DAYS_BEFORE = 7;
const DAYS_AFTER = 21;

export const addDays = (base: Date, days: number): Date => {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
};

const buildChips = (today: Date, active: string): readonly DayChip[] => {
  let previousMonth = -1;
  return Array.from({ length: DAYS_BEFORE + DAYS_AFTER + 1 }, (_, i) => {
    const date = addDays(today, i - DAYS_BEFORE);
    const id = localDate(date);
    const monthRolled = date.getMonth() !== previousMonth;
    previousMonth = date.getMonth();
    return {
      id,
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      day: String(date.getDate()),
      isToday: id === localDate(today),
      active: id === active,
      monthLabel: monthRolled
        ? date.toLocaleDateString('en-US', { month: 'long' })
        : undefined,
    };
  });
};

/** Backend block → the grid's shape (range dates become noon-anchored
 *  Dates so a timezone can't shear them into the neighbor day). */
export const toUiBlocks = (
  blocks: ReadonlyArray<CalendarBlockDto>,
): readonly CalendarBlock[] =>
  blocks.map((block) => ({
    id: block.id,
    label: block.label,
    allDay: block.allDay,
    startMin: block.startMin,
    endMin: block.endMin,
    dates:
      block.dates.kind === 'range'
        ? {
            kind: 'range',
            start: new Date(`${block.dates.start}T12:00:00`),
            end: new Date(`${block.dates.end}T12:00:00`),
          }
        : block.dates,
  }));

export const toScheduleVM = (
  day: AgendaDayVM,
  today: Date,
  local: {
    readonly blocks: readonly CalendarBlock[];
    readonly bufferMinutes: number;
    readonly loading: boolean;
  },
): ScheduleVM => {
  const { blocks, bufferMinutes, loading } = local;
  const activeDate = new Date(`${day.date}T12:00:00`);
  return {
    bufferMinutes,
    dateLabel: day.dateLabel,
    isToday: day.isToday,
    days: buildChips(today, day.date),
    activeDate,
    dateBounds: {
      from: addDays(today, -DAYS_BEFORE),
      to: addDays(today, DAYS_AFTER),
    },
    summary: day.summary,
    appointments: day.appointments,
    zones: resolveZones(blocks, activeDate),
    dayStartMin: DAY_START_MIN,
    dayEndMin: DAY_END_MIN,
    hours: hourMarks(),
    loading,
    empty: day.empty,
    canSchedule: true,
  };
};
