/**
 * Scrollable date strip of the Schedule screen — a horizontal row of day
 * chips (weekday + number) that scrolls backward into the past and forward
 * into the future. On mount it positions the scroll so TODAY sits first;
 * the active day is filled, today carries a dot. A chip carries a floating
 * month label wherever the month rolls over, so scrolling across a boundary
 * (e.g. Aug → Sep) is never ambiguous. Presentational helper of
 * schedule.view.tsx.
 */
import { useEffect, useRef } from 'react';
import { cn } from '@acme/ui';
import type { DayChip, ScheduleActions } from './schedule.types';

/** Hue of the today-dot: invisible unless today; readable on the fill. */
const dotClass = (chip: DayChip): string => {
  if (!chip.isToday) return 'bg-transparent';
  return chip.active ? 'bg-primary-foreground' : 'bg-primary';
};

const Chip = ({
  chip,
  onSelectDay,
}: { readonly chip: DayChip } & Pick<ScheduleActions, 'onSelectDay'>) => (
  <div data-today={chip.isToday || undefined} className="relative shrink-0">
    {chip.monthLabel ? (
      <span className="pointer-events-none absolute -top-4 left-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {chip.monthLabel}
      </span>
    ) : null}
    <button
      type="button"
      onClick={() => onSelectDay(chip.id)}
      aria-pressed={chip.active}
      aria-label={`${chip.weekday} ${chip.day}`}
      className={cn(
        'flex w-12 snap-start flex-col items-center rounded-lg border px-2 py-1.5 transition-colors',
        chip.active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-foreground hover:bg-muted',
      )}
    >
      <span
        className={cn(
          'text-[10px] font-medium uppercase tracking-wide',
          chip.active ? 'text-primary-foreground/80' : 'text-muted-foreground',
        )}
      >
        {chip.weekday}
      </span>
      <span className="text-sm font-semibold tabular-nums">{chip.day}</span>
      <span className={cn('mt-0.5 size-1 rounded-full', dotClass(chip))} />
    </button>
  </div>
);

export const DayStrip = ({
  days,
  onSelectDay,
}: {
  readonly days: readonly DayChip[];
} & Pick<ScheduleActions, 'onSelectDay'>) => {
  const scroller = useRef<HTMLDivElement | null>(null);
  // Default position: TODAY first — the past stays reachable scrolling back.
  // Rect-based (not offsetLeft) so it's unaffected by the label wrapper's
  // relative positioning.
  useEffect(() => {
    const box = scroller.current;
    const anchor = box?.querySelector<HTMLElement>('[data-today]');
    if (!box || !anchor) return;
    const boxRect = box.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    box.scrollLeft += anchorRect.left - boxRect.left;
  }, []);
  return (
    <div
      ref={scroller}
      role="tablist"
      aria-label="Pick a day"
      className="flex min-w-0 max-w-full snap-x gap-1.5 overflow-x-auto pt-4 pb-1"
    >
      {days.map((chip) => (
        <Chip key={chip.id} chip={chip} onSelectDay={onSelectDay} />
      ))}
    </div>
  );
};
