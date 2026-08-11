/**
 * Time fields + state hook of the Block-time popover: the 30-min time
 * selects and the form state that builds the NewCalendarBlock. The "When"
 * pickers (date range / recurring pattern) live in block-time.when.tsx.
 */
import { useEffect, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@acme/ui';
import { DAY_END_MIN, DAY_START_MIN, toLabel } from '../schedule.time';
import type {
  NewCalendarBlock,
  NewCalendarBlockDates,
} from '../schedule.types';

export type BlockWhen = 'dates' | 'recurring';
export type RecurringPattern = 'daily' | 'custom';

export const TIMES: readonly number[] = Array.from(
  { length: (DAY_END_MIN - DAY_START_MIN) / 30 + 1 },
  (_, i) => DAY_START_MIN + i * 30,
);

export const TimeSelect = ({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  readonly value: number;
  readonly onChange: (min: number) => void;
  readonly options: readonly number[];
  readonly ariaLabel: string;
}) => (
  <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
    <SelectTrigger className="h-8 w-24 text-xs" aria-label={ariaLabel}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((min) => (
        <SelectItem key={min} value={String(min)}>
          {toLabel(min)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

/** All the popover's form state plus the submit that builds the block. The
 *  date range re-anchors to the day being viewed each time the popover
 *  opens, so "block this day" stays a one-look confirmation, not a hunt. */
export const useBlockForm = (params: {
  readonly activeDate: Date;
  readonly open: boolean;
  readonly onBlockTime: (block: NewCalendarBlock) => void;
  readonly close: () => void;
}) => {
  const { activeDate, open, onBlockTime, close } = params;
  const [label, setLabel] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startMin, setStartMin] = useState(10 * 60);
  const [endMin, setEndMin] = useState(11 * 60);
  const [when, setWhen] = useState<BlockWhen>('dates');
  const [range, setRange] = useState<DateRange>({
    from: activeDate,
    to: activeDate,
  });
  const [pattern, setPattern] = useState<RecurringPattern>('daily');
  const [days, setDays] = useState<readonly string[]>([]);
  // Remounts the calendar's displayed month exactly once per open (via
  // `key`) — otherwise DayPicker pages to the browser's real current month
  // on mount and never re-pages itself when `activeDate` changes underneath
  // an already-mounted popover.
  const [monthKey, setMonthKey] = useState(() => activeDate.getTime());

  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      setRange({ from: activeDate, to: activeDate });
      setMonthKey(activeDate.getTime());
    }
    wasOpen.current = open;
  }, [open, activeDate]);

  const valid =
    (allDay || endMin > startMin) &&
    (when === 'dates' ? !!range.from : pattern === 'daily' || days.length > 0);

  const submit = () => {
    const dates: NewCalendarBlockDates =
      when === 'dates' && range.from
        ? { kind: 'range', start: range.from, end: range.to ?? range.from }
        : {
            kind: 'recurring',
            pattern: pattern === 'daily' ? 'daily' : days.map(Number),
          };
    onBlockTime({
      label: label.trim() || 'Blocked',
      allDay,
      startMin,
      endMin,
      dates,
    });
    close();
    setLabel('');
  };

  return {
    label,
    setLabel,
    allDay,
    setAllDay,
    startMin,
    setStartMin,
    endMin,
    setEndMin,
    when,
    setWhen,
    range,
    setRange,
    monthKey,
    pattern,
    setPattern,
    days,
    setDays,
    valid,
    submit,
  };
};
