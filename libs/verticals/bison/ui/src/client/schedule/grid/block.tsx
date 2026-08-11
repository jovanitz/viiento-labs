/**
 * A single block on the Schedule grid — client appointment or break — with
 * its reorder tones (idle / draggable / dragged / invalid / cascade-shifted)
 * and the resize pill. Breaks render dashed with a coffee icon and no
 * service line. Presentational helper of grid.tsx.
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { GripHorizontal } from 'lucide-react';
import { cn } from '@acme/ui';
import { PX_PER_MIN, toLabel } from '../schedule.time';
import type { useReorderDrag } from '../reorder/reorder.drag';
import type { ScheduleBlock } from '../schedule.types';

export type Drag = ReturnType<typeof useReorderDrag>;
export type BlockTone = 'idle' | 'draggable' | 'moved' | 'invalid' | 'shifted';

const TONE: Record<BlockTone, string> = {
  idle: 'border-border bg-muted',
  draggable:
    'cursor-grab active:cursor-grabbing border-primary/40 bg-[color-mix(in_oklab,var(--primary)_8%,var(--background))]',
  // Opaque tints (token color-mix over the page background) so the covered
  // appointment never bleeds into the dragged block's text.
  moved:
    'z-10 cursor-grabbing border-primary bg-[color-mix(in_oklab,var(--primary)_18%,var(--background))] shadow-md',
  invalid:
    'z-10 cursor-grabbing border-destructive bg-[color-mix(in_oklab,var(--destructive)_14%,var(--background))] shadow-md',
  shifted:
    'border-warning/60 bg-[color-mix(in_oklab,var(--warning)_12%,var(--background))]',
};

/** The dragged block reads primary (destructive when it doesn't fit);
 *  cascade-shifted neighbors read warning. */
export const toneFor = (
  block: ScheduleBlock,
  drag: Drag,
  committed: readonly ScheduleBlock[],
  reorderActive: boolean,
): BlockTone => {
  const p = drag.preview;
  if (!p) return reorderActive ? 'draggable' : 'idle';
  if (block.id === p.movedId) return p.ok ? 'moved' : 'invalid';
  const before = committed.find((b) => b.id === block.id);
  return before && before.startMin !== block.startMin ? 'shifted' : 'draggable';
};

type BlockProps = {
  readonly block: ScheduleBlock;
  readonly tone: BlockTone;
  readonly col: number;
  readonly cols: number;
  readonly dayStartMin: number;
  readonly drag: Drag;
  readonly reorderActive: boolean;
} & HTMLAttributes<HTMLDivElement>;

/** forwardRef + rest-spread so `DropdownMenuTrigger asChild` can wrap a
 *  block: Radix injects its ref and event handlers via Slot, and both must
 *  land on the root div or the menu never opens. */
export const Block = forwardRef<HTMLDivElement, BlockProps>((props, ref) => {
  const {
    block,
    tone,
    col,
    cols,
    dayStartMin,
    drag,
    reorderActive,
    className,
    style,
    ...rest
  } = props;
  return (
    <div
      ref={ref}
      {...rest}
      {...(reorderActive ? drag.moveHandlers(block.id) : {})}
      className={cn(
        'absolute flex touch-none select-none flex-col items-start overflow-hidden rounded-md border px-2 py-0.5 transition-colors',
        TONE[tone],
        className,
      )}
      style={{
        top: (block.startMin - dayStartMin) * PX_PER_MIN,
        height: block.durationMinutes * PX_PER_MIN,
        left: `${(col / cols) * 100}%`,
        width: `calc(${100 / cols}% - 2px)`,
        ...style,
      }}
    >
      <p className="truncate text-xs font-medium text-foreground">
        {block.clientName}
      </p>
      <p className="truncate text-[11px] text-muted-foreground">
        {toLabel(block.startMin)} –{' '}
        {toLabel(block.startMin + block.durationMinutes)}
        {block.service ? ` · ${block.service}` : ''}
      </p>
      {reorderActive ? (
        // Resize zone = ONLY the small centered pill, never a full-width strip —
        // a wide strip silently turned bottom-half grabs into resizes (on a
        // 15-min block it covered half the block). The rest of the block moves.
        <div
          {...drag.resizeHandlers(block.id)}
          aria-label={`Resize ${block.clientName}`}
          className="absolute bottom-0 left-1/2 flex h-3 w-10 -translate-x-1/2 cursor-ns-resize touch-none items-center justify-center rounded-t-sm hover:bg-foreground/10"
        >
          <GripHorizontal className="size-3 text-muted-foreground" />
        </div>
      ) : null}
    </div>
  );
});
Block.displayName = 'Block';
