/**
 * Pure day-grid time/label primitives shared across the Schedule screen —
 * the day's bounds, snap/format helpers and the grid's px-per-minute scale.
 * No imports beyond types; runs anywhere.
 */

/** The grid always spans the full day. */
export const DAY_START_MIN = 0;
export const DAY_END_MIN = 24 * 60;

export const MIN_DURATION = 15;
export const MAX_DURATION = 180;
export const DURATION_STEP = 15;

export const toMin = (label: string): number => {
  const [h = 0, m = 0] = label.split(':').map(Number);
  return h * 60 + m;
};

export const toLabel = (min: number): string =>
  `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

export const hourMarks = (): ReadonlyArray<{ min: number; label: string }> => {
  const marks: Array<{ min: number; label: string }> = [];
  for (let min = DAY_START_MIN; min <= DAY_END_MIN; min += 60)
    marks.push({ min, label: toLabel(min) });
  return marks;
};

/** Vertical scale of the day grid — px per minute (15 min = 24px). Lives with
 *  the pure math so drag hooks convert px↔min without importing the grid. */
export const PX_PER_MIN = 1.6;

export const snapMin = (min: number): number =>
  Math.round(min / DURATION_STEP) * DURATION_STEP;
