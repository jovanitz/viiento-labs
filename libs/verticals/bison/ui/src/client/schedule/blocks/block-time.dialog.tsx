/**
 * "Block time" modal — creates a calendar block without leaving the grid.
 * A dialog rather than a popover: picking dates/patterns to block off is a
 * focused task in its own right, not a quick aside, so it earns the dimmed
 * backdrop and full attention. "Specific date(s)" is a real calendar
 * (Calendly-style "date override"): a single day when start=end, or a range
 * for something like a week of vacation — always shown explicitly, never
 * implied by whatever day the grid happens to be on. "Recurring" is the
 * separate, indefinite weekly rule (every day / specific weekdays). Submits
 * a NewCalendarBlock; the container persists it.
 */
import { useState } from 'react';
import { CalendarOff } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Switch,
} from '@acme/ui';
import { TIMES, TimeSelect, useBlockForm } from './block-time.form';
import { DatesPicker, RecurringPicker, WhenPicker } from './block-time.when';
import type { NewCalendarBlock } from '../schedule.types';

const FormBody = ({
  form,
  bounds,
}: {
  readonly form: ReturnType<typeof useBlockForm>;
  readonly bounds: { readonly from: Date; readonly to: Date };
}) => (
  <>
    <div className="grid gap-1.5">
      <Label htmlFor="block-label">Label</Label>
      <Input
        id="block-label"
        placeholder="Vacation, lunch, cleanup…"
        value={form.label}
        onChange={(e) => form.setLabel(e.target.value)}
      />
    </div>
    <WhenPicker when={form.when} onWhen={form.setWhen} />
    {form.when === 'dates' ? (
      <DatesPicker
        range={form.range}
        onRange={form.setRange}
        bounds={bounds}
        monthKey={form.monthKey}
      />
    ) : (
      <RecurringPicker
        pattern={form.pattern}
        onPattern={form.setPattern}
        days={form.days}
        onDays={form.setDays}
      />
    )}
    <div className="flex items-center justify-between">
      <Label htmlFor="block-all-day">All day</Label>
      <Switch
        id="block-all-day"
        checked={form.allDay}
        onCheckedChange={form.setAllDay}
      />
    </div>
    {!form.allDay ? (
      <div className="flex items-center gap-2">
        <TimeSelect
          value={form.startMin}
          onChange={form.setStartMin}
          options={TIMES.slice(0, -1)}
          ariaLabel="Start time"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <TimeSelect
          value={form.endMin}
          onChange={form.setEndMin}
          options={TIMES.filter((t) => t > form.startMin)}
          ariaLabel="End time"
        />
      </div>
    ) : null}
    <Button disabled={!form.valid} onClick={form.submit}>
      Block
    </Button>
  </>
);

export const BlockTimeButton = ({
  activeDate,
  dateBounds,
  onBlockTime,
}: {
  readonly activeDate: Date;
  readonly dateBounds: { readonly from: Date; readonly to: Date };
  readonly onBlockTime: (block: NewCalendarBlock) => void;
}) => {
  const [open, setOpen] = useState(false);
  const form = useBlockForm({
    activeDate,
    open,
    onBlockTime,
    close: () => setOpen(false),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarOff className="mr-2 size-4" />
          Block time
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block time</DialogTitle>
        </DialogHeader>
        <FormBody form={form} bounds={dateBounds} />
      </DialogContent>
    </Dialog>
  );
};
