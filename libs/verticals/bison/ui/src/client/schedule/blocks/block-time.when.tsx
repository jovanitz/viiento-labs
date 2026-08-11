/**
 * The "When" section of the Block-time popover — the top-level Specific
 * date(s) / Recurring toggle, the range calendar (Calendly-style "date
 * override": a single day when start=end, or a run of days for something
 * like a week of vacation), and the recurring weekday pattern picker.
 */
import { format, isSameDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar, Label, ToggleGroup, ToggleGroupItem } from '@acme/ui';
import type { BlockWhen, RecurringPattern } from './block-time.form';

const WEEKDAYS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: 'S' },
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
];

/** "Specific date(s)" vs "a repeating rule" — one field, plain language.
 *  There is no separate "single day" toggle: a range where start=end IS a
 *  single day, so picking one date on the calendar already does the right
 *  thing. */
export const WhenPicker = ({
  when,
  onWhen,
}: {
  readonly when: BlockWhen;
  readonly onWhen: (when: BlockWhen) => void;
}) => (
  <ToggleGroup
    type="single"
    value={when}
    onValueChange={(v) => v && onWhen(v as BlockWhen)}
    className="justify-start"
  >
    <ToggleGroupItem value="dates" size="sm">
      Specific date(s)
    </ToggleGroupItem>
    <ToggleGroupItem value="recurring" size="sm">
      Recurring
    </ToggleGroupItem>
  </ToggleGroup>
);

const rangeLabel = (range: DateRange): string => {
  if (!range.from) return 'Pick a date';
  if (range.to && !isSameDay(range.from, range.to))
    return `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d')}`;
  return format(range.from, 'EEE, MMM d');
};

/** Range calendar + a plain-language echo of the selection ("Aug 15" or
 *  "Aug 15 – Aug 22") so the user always SEES exactly what will block before
 *  submitting — replacing the old implicit "This day" that hid it. Bounded
 *  to the fixture window so every pick lands on a real, navigable day. */
/** react-day-picker's range mode always extends the *existing* `from`
 *  anchor once a range is complete (even a same-day range) — so the popover
 *  pre-seeding `{from: activeDate, to: activeDate}` on open would otherwise
 *  make every first click balloon into "activeDate…clickedDay" instead of
 *  starting fresh there. Any click away from both boundaries restarts the
 *  range at the clicked day; a click on a boundary still falls through to
 *  the library's own collapse/deselect behavior. */
const nextRange = (
  current: DateRange,
  next: DateRange | undefined,
  selectedDay: Date,
): DateRange | undefined => {
  const onBoundary =
    (current.from && isSameDay(current.from, selectedDay)) ||
    (current.to && isSameDay(current.to, selectedDay));
  if (current.from && current.to && !onBoundary)
    return { from: selectedDay, to: undefined };
  return next;
};

export const DatesPicker = ({
  range,
  onRange,
  bounds,
  monthKey,
}: {
  readonly range: DateRange;
  readonly onRange: (range: DateRange) => void;
  readonly bounds: { readonly from: Date; readonly to: Date };
  /** Remounts the calendar (re-paging to `range.from`'s month) once per
   *  popover open — see useBlockForm. */
  readonly monthKey: number;
}) => (
  <div className="grid gap-1.5">
    <p className="text-xs font-medium text-foreground">{rangeLabel(range)}</p>
    <Calendar
      key={monthKey}
      mode="range"
      defaultMonth={range.from ?? bounds.from}
      selected={range}
      onSelect={(next, selectedDay) => {
        const resolved = nextRange(range, next, selectedDay);
        if (resolved?.from) onRange(resolved);
      }}
      fromDate={bounds.from}
      toDate={bounds.to}
      className="w-fit rounded-md border p-2"
    />
  </div>
);

export const RecurringPicker = ({
  pattern,
  onPattern,
  days,
  onDays,
}: {
  readonly pattern: RecurringPattern;
  readonly onPattern: (pattern: RecurringPattern) => void;
  readonly days: readonly string[];
  readonly onDays: (days: readonly string[]) => void;
}) => (
  <div className="grid gap-1.5">
    <Label>Repeat</Label>
    <ToggleGroup
      type="single"
      value={pattern}
      onValueChange={(v) => v && onPattern(v as RecurringPattern)}
      className="justify-start"
    >
      <ToggleGroupItem value="daily" size="sm">
        Every day
      </ToggleGroupItem>
      <ToggleGroupItem value="custom" size="sm">
        Specific weekdays
      </ToggleGroupItem>
    </ToggleGroup>
    {pattern === 'custom' ? (
      <ToggleGroup
        type="multiple"
        value={[...days]}
        onValueChange={onDays}
        className="justify-start"
      >
        {WEEKDAYS.map((d) => (
          <ToggleGroupItem
            key={d.value}
            value={String(d.value)}
            size="sm"
            aria-label={`Weekday ${d.value}`}
          >
            {d.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    ) : null}
  </div>
);
