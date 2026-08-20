import { type Brand, type Result, err, ok } from '@acme/shared';
import { invalidCalendarBlock, invalidCalendarBlockId } from './errors';
import type { AppointmentDomainError } from './errors';

/**
 * Blocked time on the account's calendar (ADR-free extraction of the
 * approved prototype's Block-time model): either a concrete date RANGE
 * (one day when start=end — or a vacation run) or a RECURRING weekly
 * pattern (every day / specific weekdays, 0 = Sunday) with no end date.
 * Every scheduling rule treats a block as a wall; deleting a recurring
 * block removes its whole series.
 *
 * Dates are YYYY-MM-DD wall-calendar strings (same reasoning as
 * Appointment). An all-day block normalizes to the full day span.
 */
export type CalendarBlockId = Brand<string, 'CalendarBlockId'>;

export const makeCalendarBlockId = (
  raw: string,
): Result<CalendarBlockId, AppointmentDomainError> => {
  const value = raw.trim();
  if (value.length === 0) {
    return err(invalidCalendarBlockId('Calendar block id must not be empty.'));
  }
  return ok(value as CalendarBlockId);
};

export type CalendarBlockDates =
  | { readonly kind: 'range'; readonly start: string; readonly end: string }
  | {
      readonly kind: 'recurring';
      readonly pattern: 'daily' | readonly number[];
    };

export type CalendarBlock = {
  readonly id: CalendarBlockId;
  readonly label: string;
  readonly allDay: boolean;
  readonly startMin: number;
  readonly endMin: number;
  readonly dates: CalendarBlockDates;
  readonly createdAt: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MINUTES = 24 * 60;
const LABEL_MAX = 120;

const spanProblems = (input: {
  readonly allDay: boolean;
  readonly startMin: number;
  readonly endMin: number;
}): readonly string[] => {
  if (input.allDay) return [];
  const problems: string[] = [];
  const validInts =
    Number.isInteger(input.startMin) && Number.isInteger(input.endMin);
  if (
    !validInts ||
    input.startMin < 0 ||
    input.endMin > DAY_MINUTES ||
    input.startMin >= input.endMin
  ) {
    problems.push('the time span must sit within the day, start before end');
  }
  return problems;
};

const datesProblems = (dates: CalendarBlockDates): readonly string[] => {
  const problems: string[] = [];
  if (dates.kind === 'range') {
    if (!DATE_RE.test(dates.start) || !DATE_RE.test(dates.end)) {
      problems.push('range dates must be YYYY-MM-DD');
    } else if (dates.start > dates.end) {
      problems.push('range start must not be after its end');
    }
    return problems;
  }
  if (dates.pattern === 'daily') return problems;
  const weekdays = dates.pattern;
  const valid = weekdays.every(
    (day) => Number.isInteger(day) && day >= 0 && day <= 6,
  );
  if (weekdays.length === 0 || !valid) {
    problems.push('recurring weekdays must be 0..6 and non-empty');
  }
  if (new Set(weekdays).size !== weekdays.length) {
    problems.push('recurring weekdays must not repeat');
  }
  return problems;
};

export const createCalendarBlock = (input: {
  readonly id: CalendarBlockId;
  readonly label: string;
  readonly allDay: boolean;
  readonly startMin: number;
  readonly endMin: number;
  readonly dates: CalendarBlockDates;
  readonly occurredAt: string;
}): Result<CalendarBlock, AppointmentDomainError> => {
  const label = input.label.trim();
  const problems: string[] = [];
  if (label.length === 0) problems.push('label must not be empty');
  if (label.length > LABEL_MAX) {
    problems.push(`label must be at most ${LABEL_MAX} characters`);
  }
  problems.push(...spanProblems(input), ...datesProblems(input.dates));
  if (problems.length > 0) {
    return err(
      invalidCalendarBlock('The calendar block is invalid.', {
        details: { problems },
      }),
    );
  }
  return ok({
    id: input.id,
    label,
    allDay: input.allDay,
    startMin: input.allDay ? 0 : input.startMin,
    endMin: input.allDay ? DAY_MINUTES : input.endMin,
    dates: input.dates,
    createdAt: input.occurredAt,
  });
};
