/**
 * "New appointment" — direct on the timeline, not a modal: a draft block
 * appears right where you clicked on an empty grid slot (see create-slot.ts)
 * and a small popover anchored to it holds the form. The draft itself is
 * draggable/resizable on the grid (same gesture as an existing appointment
 * in Reorder mode, see new-appointment.drag.ts) and the popover's Start/End
 * selects are the other way to do the same thing — both drive the same form
 * state, so they always agree.
 */
import { GripHorizontal } from 'lucide-react';
import {
  Button,
  Combobox,
  Label,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@acme/ui';
import {
  DAY_END_MIN,
  DAY_START_MIN,
  DURATION_STEP,
  PX_PER_MIN,
} from '../schedule.time';
import { TimeSelect } from '../blocks/block-time.form';
import type { useAppointmentForm } from './new-appointment.form';
import type { useDraftDrag } from './new-appointment.drag';
import type { ClientRow } from '../../clients/clients.types';

/** 15-min granularity (DURATION_STEP), not Block-time's 30-min TIMES — an
 *  appointment's default 45-min length must land on a real option. */
const TIMES: readonly number[] = Array.from(
  { length: (DAY_END_MIN - DAY_START_MIN) / DURATION_STEP + 1 },
  (_, i) => DAY_START_MIN + i * DURATION_STEP,
);

const FormBody = ({
  form,
  clients,
  onCreateClient,
}: {
  readonly form: ReturnType<typeof useAppointmentForm>;
  readonly clients: readonly ClientRow[];
  readonly onCreateClient: (name: string) => ClientRow;
}) => (
  <>
    <div className="grid gap-1.5">
      <Label htmlFor="appt-client">Client</Label>
      <Combobox
        options={clients.map((c) => ({ value: c.id, label: c.name }))}
        value={form.clientId}
        onChange={form.setClientId}
        onCreate={(name) => form.setClientId(onCreateClient(name).id)}
        placeholder="Select a client…"
        searchPlaceholder="Search clients…"
        className="w-full"
      />
    </div>
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
    <Button disabled={!form.valid} onClick={form.submit}>
      Book appointment
    </Button>
  </>
);

export const DraftAppointmentBlock = ({
  open,
  onOpenChange,
  dayStartMin,
  form,
  drag,
  clients,
  onCreateClient,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly dayStartMin: number;
  readonly form: ReturnType<typeof useAppointmentForm>;
  readonly drag: ReturnType<typeof useDraftDrag>;
  readonly clients: readonly ClientRow[];
  readonly onCreateClient: (name: string) => ClientRow;
}) => {
  if (!open) return null;
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <div
          {...drag.moveHandlers}
          data-radix-keep-open
          className="absolute inset-x-0 flex touch-none cursor-grab select-none items-end justify-center rounded-md border-2 border-dashed border-primary bg-primary/10 active:cursor-grabbing"
          style={{
            top: (form.startMin - dayStartMin) * PX_PER_MIN,
            height: (form.endMin - form.startMin) * PX_PER_MIN,
          }}
        >
          <div
            {...drag.resizeHandlers}
            aria-label="Resize new appointment"
            className="flex h-3 w-10 -translate-y-0.5 cursor-ns-resize touch-none items-center justify-center rounded-t-sm hover:bg-foreground/10"
          >
            <GripHorizontal className="size-3 text-muted-foreground" />
          </div>
        </div>
      </PopoverAnchor>
      <PopoverContent
        side="bottom"
        align="center"
        collisionPadding={16}
        className="grid w-80 max-w-[calc(100vw-2rem)] gap-4"
      >
        <FormBody
          form={form}
          clients={clients}
          onCreateClient={onCreateClient}
        />
      </PopoverContent>
    </Popover>
  );
};
