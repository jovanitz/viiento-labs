/**
 * "Now" line for the day grid — a live indicator of the current time, shown
 * only on today's grid (the grid itself always spans the full 24h day). Read
 * from the real wall clock, not a fixture: on open (and when paging to a new
 * day) the grid auto-scrolls its bounded `[data-grid-scroll]` box (see
 * schedule.view.tsx's Body — the day strip/toolbar above it never scroll) so
 * the anchor — now, or a mid-morning default on other days — sits a bit
 * above the middle of the box. It only does this once per day view, not on
 * every tick, so it never fights a manual scroll mid-interaction.
 * Presentational helper of grid.tsx.
 */
import { useEffect, useState, type RefObject } from 'react';
import { PX_PER_MIN } from '../schedule.time';

const NOW_POLL_MS = 60_000;
/** Where the grid opens on a day that isn't today — mid-morning, not 00:00. */
const DEFAULT_ANCHOR_MIN = 9 * 60;
/** Vertical placement of the anchor within the box — a bit above center. */
const ANCHOR_FRACTION = 0.4;

const minutesOfDay = (d: Date): number => d.getHours() * 60 + d.getMinutes();

/** Live current-time-of-day, ticking every minute; `null` while not
 *  `enabled` so callers can skip both rendering and scrolling for it. */
export const useNowMinutes = (enabled: boolean): number | null => {
  const [min, setMin] = useState<number | null>(() =>
    enabled ? minutesOfDay(new Date()) : null,
  );
  useEffect(() => {
    if (!enabled) {
      setMin(null);
      return;
    }
    setMin(minutesOfDay(new Date()));
    const id = setInterval(() => setMin(minutesOfDay(new Date())), NOW_POLL_MS);
    return () => clearInterval(id);
  }, [enabled]);
  return min;
};

export const NowLine = ({ min }: { readonly min: number }) => (
  <div
    className="pointer-events-none absolute inset-x-0 z-10 flex items-center gap-1.5"
    style={{ top: min * PX_PER_MIN }}
  >
    <span className="size-2 shrink-0 rounded-full bg-primary" />
    <span className="h-px flex-1 bg-primary" />
  </div>
);

/** Rect-based (not offsetTop) so it's unaffected by ancestor layout, same
 *  approach as DayStrip's initial scroll position. */
export const useScrollToAnchor = (
  gridRef: RefObject<HTMLElement | null>,
  dayKey: number,
  isToday: boolean,
) => {
  useEffect(() => {
    const grid = gridRef.current;
    const box = grid?.closest<HTMLElement>('[data-grid-scroll]');
    if (!grid || !box) return;
    const anchor = isToday ? minutesOfDay(new Date()) : DEFAULT_ANCHOR_MIN;
    const gridRect = grid.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();
    const gridTop = gridRect.top - boxRect.top + box.scrollTop;
    box.scrollTop =
      gridTop + anchor * PX_PER_MIN - box.clientHeight * ANCHOR_FRACTION;
  }, [dayKey, isToday]);
};
