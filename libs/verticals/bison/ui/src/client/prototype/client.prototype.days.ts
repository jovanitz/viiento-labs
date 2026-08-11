/**
 * The prototype's fixture day window — real dates, the 5 hand-authored,
 * richly-detailed days plus generated empty ones, and the date-strip chips
 * derived from them. Split out from client.prototype.logic.ts (which owns
 * how the click-through's overrides merge into a day) purely to keep files
 * small.
 *
 * The 5 hand-authored days sit inside a much wider fixture WINDOW of real
 * calendar days — enough past and future for the date strip to scroll like
 * a real calendar and for "Block time" to reach into next month. Days
 * outside the hand-authored 5 are generated, empty ("nothing booked") days
 * with a real date label.
 */
import type { AgendaVM } from '../agenda/agenda.types';
import {
  errorVM,
  freeDayVM,
  todayVM,
  tomorrowVM,
  yesterdayVM,
} from '../agenda/agenda.fixtures';

const WEEKDAY_LABEL = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;
const MONTH_LABEL = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** The prototype's fictional "today" — Monday, Aug 3, 2026. Baked into the
 *  hand-authored fixtures below (their own dateLabel strings); don't drift
 *  it without updating those too. */
const TODAY = new Date(2026, 7, 3);
const DAYS_BEFORE = 7;
const DAYS_AFTER = 45; // reaches mid-September — comfortably "next month"
export const TODAY_IDX = DAYS_BEFORE;
const WINDOW = DAYS_BEFORE + DAYS_AFTER + 1;

const addDays = (date: Date, n: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};
/** dayIdx → real date. Prototype-only bridge — the real app has no dayIdx,
 *  only real dates; this seam disappears once the screen is implemented. */
export const dateAt = (dayIdx: number): Date =>
  addDays(TODAY, dayIdx - TODAY_IDX);

/** Same "Mon, Aug 3" formatting the rest of the prototype uses — exported so
 *  other fixture generators (e.g. client.prototype.clients.ts) don't grow
 *  their own copy of the weekday/month tables. */
export const dateLabelOf = (date: Date) =>
  `${WEEKDAY_LABEL[date.getDay()]}, ${MONTH_LABEL[date.getMonth()]} ${date.getDate()}`;

const isTodayIdx = (dayIdx: number) => dayIdx === TODAY_IDX;

const emptyDayVM = (dayIdx: number): AgendaVM => ({
  dateLabel: dateLabelOf(dateAt(dayIdx)),
  isToday: isTodayIdx(dayIdx),
  appointments: [],
  loading: false,
  empty: true,
  canSchedule: true,
});

/** The 5 richly-detailed days, at the offsets their own date labels already
 *  match (Sun Aug 2 … Thu Aug 6) — everything else in the window is
 *  generated as a free day. */
const HAND_AUTHORED: Readonly<Record<number, AgendaVM>> = {
  [TODAY_IDX - 1]: yesterdayVM,
  [TODAY_IDX]: todayVM,
  [TODAY_IDX + 1]: tomorrowVM,
  [TODAY_IDX + 2]: freeDayVM,
  [TODAY_IDX + 3]: errorVM,
};

export const DAYS: readonly AgendaVM[] = Array.from(
  { length: WINDOW },
  (_, i) => HAND_AUTHORED[i] ?? emptyDayVM(i),
);

/** The fixture window as date-strip chips, with a month label wherever the
 *  month rolls over (so scrolling Aug → Sep is never ambiguous). */
export const DAY_CHIPS = Array.from({ length: WINDOW }, (_, i) => {
  const date = dateAt(i);
  const prevMonth = i > 0 ? dateAt(i - 1).getMonth() : null;
  return {
    id: String(i),
    weekday: WEEKDAY_LABEL[date.getDay()],
    day: String(date.getDate()),
    isToday: isTodayIdx(i),
    monthLabel:
      prevMonth === null || prevMonth !== date.getMonth()
        ? MONTH_LABEL[date.getMonth()]
        : undefined,
  };
});
