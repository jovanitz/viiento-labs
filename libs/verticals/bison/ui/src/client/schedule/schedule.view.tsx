/**
 * Bison Manager · Client · Schedule — the graphical agenda, now the main
 * view: the day as a timeline grid. A "Reorder" toggle enables dragging the
 * appointments with three rule sets — free (overlaps allowed, drawn side by
 * side), strict (only free slots), cascade (moving one shifts the others;
 * both variants prototyped). "Block time" creates Calendly-style blocked
 * zones (one-off or recurring, up to all-day) that every rule treats as
 * walls. Reorder edits accumulate locally and commit in batch via Apply.
 *
 * @screen Bison Manager / Client / Schedule
 * @phase draft
 *
 * Presentational: a pure function of (ViewModel + actions). The reorder
 * draft, mode and live drag are view-local interaction state (see
 * schedule.drag.ts for the performance contract); `onApply` hands the batch
 * to the outside world.
 */
import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Skeleton,
  Stack,
} from '@acme/ui';
import { ScheduleGrid } from './grid/grid';
import { DayStrip } from './schedule.pager';
import { ApplyBar } from './reorder/reorder.apply-bar';
import { BufferSelect, ReorderControls } from './reorder/reorder.toolbar';
import { useReorder } from './reorder/reorder.state';
import { BlockTimeButton } from './blocks/block-time.dialog';
import type {
  ReorderMode,
  ScheduleActions,
  ScheduleVM,
} from './schedule.types';
import type { ClientRow } from '../clients/clients.types';

/** New-appointment's draft has no open position until a grid click sets one
 *  (see onSlotClick) — this is just a harmless initial value for the state,
 *  never rendered (the draft block returns null while closed). */
const INITIAL_CREATE_MIN = 9 * 60;

type BodyProps = {
  readonly vm: ScheduleVM;
  readonly reorder: ReturnType<typeof useReorder>;
  readonly onSlotClick: (startMin: number) => void;
  readonly createOpen: boolean;
  readonly createStartMin: number;
  readonly onCreateOpenChange: (open: boolean) => void;
  readonly clients: readonly ClientRow[];
  readonly onCreateClient: (name: string) => ClientRow;
} & Pick<
  ScheduleActions,
  'onCancelAppointment' | 'onRemoveBlock' | 'onRetry' | 'onCreateAppointment'
>;

const Body = ({
  vm,
  reorder,
  onCancelAppointment,
  onRemoveBlock,
  onRetry,
  onSlotClick,
  createOpen,
  createStartMin,
  onCreateOpenChange,
  onCreateAppointment,
  clients,
  onCreateClient,
}: BodyProps) => {
  if (vm.loading) return <Skeleton className="h-96" />;
  if (vm.error)
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&rsquo;t load the agenda</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          {vm.error}
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  return (
    <div className="rounded-md border border-border py-2">
      {vm.empty ? (
        <p className="flex items-center gap-2 px-4 pb-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          Nothing booked — the whole day is free.
        </p>
      ) : null}
      {/* Bounded, self-scrolling: the day strip/toolbar above never move —
       *  only the 24h timeline scrolls, and only within its own box. Top/
       *  bottom padding is slack so even an anchor near midnight (e.g. "now"
       *  at 23:30) has room to scroll all the way to its resting spot —
       *  sized to grid/now.tsx's ANCHOR_FRACTION (0.4) against this box's
       *  70vh height: 0.4*70vh top, 0.6*70vh bottom. */}
      <div
        data-grid-scroll
        className="h-[70vh] overflow-y-auto overscroll-contain"
      >
        <div className="pb-[42vh] pt-[28vh]">
          <ScheduleGrid
            vm={vm}
            blocks={reorder.blocks}
            drag={reorder.drag}
            reorderActive={reorder.mode !== 'off'}
            onCancelAppointment={onCancelAppointment}
            onRemoveBlock={onRemoveBlock}
            onSlotClick={onSlotClick}
            createOpen={createOpen}
            createStartMin={createStartMin}
            onCreateOpenChange={onCreateOpenChange}
            onCreateAppointment={onCreateAppointment}
            clients={clients}
            onCreateClient={onCreateClient}
          />
        </div>
      </div>
    </div>
  );
};

/** Buffer policy + block-time + reorder cluster — the row immediately above
 *  the grid, right-aligned. New-appointment has no toolbar entry: click an
 *  empty grid slot to start one (see create-slot.ts). */
const ReorderCluster = ({
  vm,
  reorder,
  onBufferChange,
  onBlockTime,
}: {
  readonly vm: ScheduleVM;
  readonly reorder: ReturnType<typeof useReorder>;
} & Pick<ScheduleActions, 'onBufferChange' | 'onBlockTime'>) => (
  <div className="flex flex-wrap items-center gap-2">
    <BufferSelect minutes={vm.bufferMinutes} onChange={onBufferChange} />
    <BlockTimeButton
      activeDate={vm.activeDate}
      dateBounds={vm.dateBounds}
      onBlockTime={onBlockTime}
    />
    <ReorderControls
      mode={reorder.mode}
      variant={reorder.variant}
      onMode={reorder.setMode}
      onVariant={reorder.setVariant}
    />
  </div>
);

export const ScheduleView = ({
  vm,
  initialReorder = 'off',
  onSelectDay,
  onCreateAppointment,
  onCancelAppointment,
  onBlockTime,
  onRemoveBlock,
  onBufferChange,
  onApply,
  onRetry,
  clients,
  onCreateClient,
}: {
  readonly vm: ScheduleVM;
  /** Story/preview convenience: open with a reorder mode already active. */
  readonly initialReorder?: 'off' | ReorderMode;
  /** The account's roster — the New-appointment Combobox reads from it, and
   *  can add to it inline (typing a name that doesn't exist yet offers
   *  "Create '<name>'") — see clients/clients.view.tsx for the roster's own
   *  "+ New client" entry point onto the same shared list. */
  readonly clients: readonly ClientRow[];
  readonly onCreateClient: (name: string) => ClientRow;
} & ScheduleActions) => {
  const reorder = useReorder(vm, initialReorder, onApply);
  // New-appointment is a view-local dialog: a click on an empty grid slot
  // sets where it opens — only the actual booking (onCreateAppointment) is a
  // real action bubbling outward.
  const [createOpen, setCreateOpen] = useState(false);
  const [createStartMin, setCreateStartMin] = useState(INITIAL_CREATE_MIN);
  const openCreateAt = (startMin: number) => {
    setCreateStartMin(startMin);
    setCreateOpen(true);
  };
  return (
    <Stack gap="group" className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DayStrip days={vm.days} onSelectDay={onSelectDay} />
        {vm.canSchedule && !vm.loading && !vm.error ? (
          <ReorderCluster
            vm={vm}
            reorder={reorder}
            onBufferChange={onBufferChange}
            onBlockTime={onBlockTime}
          />
        ) : null}
      </div>
      <Body
        vm={vm}
        reorder={reorder}
        onCancelAppointment={onCancelAppointment}
        onRemoveBlock={onRemoveBlock}
        onRetry={onRetry}
        onSlotClick={openCreateAt}
        createOpen={createOpen}
        createStartMin={createStartMin}
        onCreateOpenChange={setCreateOpen}
        onCreateAppointment={onCreateAppointment}
        clients={clients}
        onCreateClient={onCreateClient}
      />
      {reorder.changes.length > 0 ? (
        <ApplyBar
          count={reorder.changes.length}
          onApply={reorder.apply}
          onDiscard={reorder.discard}
        />
      ) : null}
    </Stack>
  );
};
