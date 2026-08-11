/**
 * Pure resolution of calendar blocks (blocked time) onto a concrete date —
 * a date range (a single day when start=end, or a run of days) or a
 * recurring weekly pattern (every day / specific weekdays). Real date math,
 * no fixture-day plumbing — this is the actual logic a future controller
 * would run, not a prototype stand-in.
 */
import { DAY_END_MIN, DAY_START_MIN } from '../schedule.time';
import type { DayZone, NewCalendarBlock } from '../schedule.types';

/** A committed block — the popover's submission plus an id. */
export type CalendarBlock = NewCalendarBlock & { readonly id: string };

const stripTime = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const appliesOn = (block: CalendarBlock, date: Date): boolean => {
  if (block.dates.kind === 'recurring') {
    if (block.dates.pattern === 'daily') return true;
    return block.dates.pattern.includes(date.getDay());
  }
  const day = stripTime(date).getTime();
  return (
    day >= stripTime(block.dates.start).getTime() &&
    day <= stripTime(block.dates.end).getTime()
  );
};

export const resolveZones = (
  blocks: readonly CalendarBlock[],
  date: Date,
): readonly DayZone[] =>
  blocks
    .filter((b) => appliesOn(b, date))
    .map((b) => ({
      id: b.id,
      label: b.label,
      startMin: b.allDay ? DAY_START_MIN : b.startMin,
      endMin: b.allDay ? DAY_END_MIN : b.endMin,
      recurring: b.dates.kind === 'recurring',
    }))
    .sort((a, b) => a.startMin - b.startMin);
