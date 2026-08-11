/**
 * The day grid of the Schedule screen — hour lines and blocks (appointments +
 * breaks, see block.tsx) with overlap column layout (free mode renders
 * concurrent blocks side by side, GCal style). Presentational helper of
 * schedule.view.tsx.
 */
import { memo } from 'react';
import { PX_PER_MIN } from '../schedule.time';
import { columnLayout } from '../reorder/reorder.logic';
import { ContentLayers } from './content-layers';
import { NowLine, useNowMinutes, useScrollToAnchor } from './now';
import type {
  ScheduleActions,
  ScheduleBlock,
  ScheduleVM,
} from '../schedule.types';
import type { Drag } from './block';

const HourLines = memo(
  ({ hours, dayStartMin }: Pick<ScheduleVM, 'hours' | 'dayStartMin'>) => (
    <>
      {hours.map((h) => (
        <div
          key={h.min}
          className="absolute inset-x-0 border-t border-border/60"
          style={{ top: (h.min - dayStartMin) * PX_PER_MIN }}
        >
          <span className="absolute -top-2 left-2 w-10 bg-background pr-1 text-[11px] tabular-nums text-muted-foreground">
            {h.label}
          </span>
        </div>
      ))}
    </>
  ),
);
HourLines.displayName = 'HourLines';

type ScheduleGridProps = {
  readonly vm: ScheduleVM;
  /** The committed draft layout (preview overrides it while dragging). */
  readonly blocks: readonly ScheduleBlock[];
  readonly drag: Drag;
  readonly reorderActive: boolean;
  /** Clicking anywhere on the empty grid — opens New-appointment pre-filled
   *  at that time. No rules gate it; those only apply to reordering. */
  readonly onSlotClick: (startMin: number) => void;
  readonly createOpen: boolean;
  readonly createStartMin: number;
  readonly onCreateOpenChange: (open: boolean) => void;
} & Pick<
  ScheduleActions,
  'onCancelAppointment' | 'onRemoveBlock' | 'onCreateAppointment'
>;

export const ScheduleGrid = ({
  vm,
  blocks,
  drag,
  reorderActive,
  onCancelAppointment,
  onRemoveBlock,
  onSlotClick,
  createOpen,
  createStartMin,
  onCreateOpenChange,
  onCreateAppointment,
}: ScheduleGridProps) => {
  const shown = drag.preview?.blocks ?? blocks;
  // While dragging, the moved block keeps FULL width above everyone (GCal
  // style) — feeding it to the column layout made it jump to a half-width
  // column the moment it overlapped, obscuring which block you were moving.
  // Columns re-settle for real on drop.
  const movedId = drag.preview?.movedId;
  const layout = columnLayout(
    movedId === undefined ? shown : shown.filter((b) => b.id !== movedId),
  );
  const nowMin = useNowMinutes(vm.isToday);
  useScrollToAnchor(drag.gridRef, vm.activeDate.getTime(), vm.isToday);
  return (
    <div
      ref={drag.gridRef}
      className="relative"
      style={{ height: (vm.dayEndMin - vm.dayStartMin) * PX_PER_MIN + 8 }}
    >
      <HourLines hours={vm.hours} dayStartMin={vm.dayStartMin} />
      {nowMin !== null ? <NowLine min={nowMin} /> : null}
      <ContentLayers
        vm={vm}
        shown={shown}
        blocks={blocks}
        layout={layout}
        drag={drag}
        reorderActive={reorderActive}
        onCancelAppointment={onCancelAppointment}
        onRemoveBlock={onRemoveBlock}
        onSlotClick={onSlotClick}
        createOpen={createOpen}
        createStartMin={createStartMin}
        onCreateOpenChange={onCreateOpenChange}
        onCreateAppointment={onCreateAppointment}
      />
    </div>
  );
};
