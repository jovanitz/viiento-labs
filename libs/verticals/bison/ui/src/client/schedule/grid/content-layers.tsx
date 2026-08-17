/**
 * Everything inside the day grid's hour-lines gutter: the slot-click catcher
 * (behind everything, so a click only reaches it where nothing else is
 * rendered — see create-slot.ts), zones, the required-gap buffer strips and
 * the blocks (appointments + breaks) themselves. Presentational helper of
 * grid.tsx, split out to keep that file under the line limit.
 */
import { memo } from 'react';
import { PX_PER_MIN } from '../schedule.time';
import { Block, toneFor, type Drag } from './block';
import { BlockMenu } from './block-menu';
import { ZoneLayer } from '../blocks/zone.layer';
import { useCreateSlotClick } from './create-slot';
import { NewAppointmentLayer } from '../new-appointment/new-appointment.layer';
import type {
  ScheduleActions,
  ScheduleBlock,
  ScheduleVM,
} from '../schedule.types';
import type { ClientRow } from '../../clients/clients.types';

/** Required-gap zones: the striped strip after each appointment is time the
 *  policy reserves (travel/cleanup) — not droppable. */
const BufferLayer = memo(
  ({
    blocks,
    bufferMinutes,
    dayStartMin,
    dayEndMin,
  }: {
    readonly blocks: readonly ScheduleBlock[];
    readonly bufferMinutes: number;
    readonly dayStartMin: number;
    readonly dayEndMin: number;
  }) => (
    <>
      {blocks
        .filter((b) => b.kind === 'appointment')
        .map((b) => {
          const start = b.startMin + b.durationMinutes;
          const height = Math.min(bufferMinutes, dayEndMin - start);
          if (height <= 0) return null;
          return (
            <div
              key={`buf-${b.id}`}
              className="pointer-events-none absolute inset-x-0 opacity-60"
              style={{
                top: (start - dayStartMin) * PX_PER_MIN,
                height: height * PX_PER_MIN,
                backgroundImage:
                  'repeating-linear-gradient(135deg, transparent, transparent 5px, var(--border) 5px, var(--border) 6px)',
              }}
            />
          );
        })}
    </>
  ),
);
BufferLayer.displayName = 'BufferLayer';

/** The block elements (with column slots), menu-wrapped in view mode. */
const BlockItems = ({
  shown,
  layout,
  committed,
  dayStartMin,
  drag,
  reorderActive,
  canSchedule,
  onCancelAppointment,
}: {
  readonly shown: readonly ScheduleBlock[];
  readonly layout: ReadonlyMap<string, { col: number; cols: number }>;
  readonly committed: readonly ScheduleBlock[];
  readonly dayStartMin: number;
  readonly drag: Drag;
  readonly reorderActive: boolean;
  readonly canSchedule: boolean;
} & Pick<ScheduleActions, 'onCancelAppointment'>) => (
  <>
    {shown.map((block) => {
      const slot = layout.get(block.id) ?? { col: 0, cols: 1 };
      const rendered = (
        <Block
          key={block.id}
          block={block}
          tone={toneFor(block, drag, committed, reorderActive)}
          col={slot.col}
          cols={slot.cols}
          dayStartMin={dayStartMin}
          drag={drag}
          reorderActive={reorderActive}
        />
      );
      if (reorderActive || !canSchedule) return rendered;
      return (
        <BlockMenu
          key={block.id}
          block={block}
          onCancelAppointment={onCancelAppointment}
        >
          {rendered}
        </BlockMenu>
      );
    })}
  </>
);

type ContentLayersProps = {
  readonly vm: ScheduleVM;
  readonly shown: readonly ScheduleBlock[];
  readonly blocks: readonly ScheduleBlock[];
  readonly layout: ReadonlyMap<string, { col: number; cols: number }>;
  readonly drag: Drag;
  readonly reorderActive: boolean;
  readonly onSlotClick: (startMin: number) => void;
  /** New-appointment draft — open state + anchor time live in
   *  schedule.view.tsx; the draft block itself renders here so it sits
   *  directly on the timeline. */
  readonly createOpen: boolean;
  readonly createStartMin: number;
  readonly onCreateOpenChange: (open: boolean) => void;
  readonly clients: readonly ClientRow[];
  readonly onCreateClient: (name: string) => ClientRow;
} & Pick<
  ScheduleActions,
  'onCancelAppointment' | 'onRemoveBlock' | 'onCreateAppointment'
>;

export const ContentLayers = ({
  vm,
  shown,
  blocks,
  layout,
  drag,
  reorderActive,
  onCancelAppointment,
  onRemoveBlock,
  onSlotClick,
  createOpen,
  createStartMin,
  onCreateOpenChange,
  onCreateAppointment,
  clients,
  onCreateClient,
}: ContentLayersProps) => {
  const handleSlotClick = useCreateSlotClick({
    gridRef: drag.gridRef,
    enabled: !reorderActive && vm.canSchedule,
    onSlot: onSlotClick,
  });
  return (
    <div className="absolute inset-y-0 left-14 right-2">
      <div className="absolute inset-0" onClick={handleSlotClick} />
      <ZoneLayer
        zones={vm.zones}
        dayStartMin={vm.dayStartMin}
        interactive={!reorderActive && vm.canSchedule}
        onRemoveBlock={onRemoveBlock}
      />
      {vm.bufferMinutes > 0 ? (
        <BufferLayer
          blocks={shown}
          bufferMinutes={vm.bufferMinutes}
          dayStartMin={vm.dayStartMin}
          dayEndMin={vm.dayEndMin}
        />
      ) : null}
      <BlockItems
        shown={shown}
        layout={layout}
        committed={blocks}
        dayStartMin={vm.dayStartMin}
        drag={drag}
        reorderActive={reorderActive}
        canSchedule={vm.canSchedule}
        onCancelAppointment={onCancelAppointment}
      />
      <NewAppointmentLayer
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        initialStartMin={createStartMin}
        dayStartMin={vm.dayStartMin}
        gridRef={drag.gridRef}
        onCreateAppointment={onCreateAppointment}
        clients={clients}
        onCreateClient={onCreateClient}
      />
    </div>
  );
};
