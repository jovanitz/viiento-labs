/**
 * Blocked-time zones on the Schedule grid — dense-striped background bands
 * with a lock + label. They are walls, not blocks: never draggable; while
 * reorder is active they turn inert so drags glide over them. In view mode a
 * click opens their menu (remove — a recurring block goes with its series).
 */
import { forwardRef, memo, type HTMLAttributes } from 'react';
import { Lock, Repeat } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from '@acme/ui';
import { PX_PER_MIN } from '../schedule.time';
import type { DayZone, ScheduleActions } from '../schedule.types';

type ZoneProps = {
  readonly zone: DayZone;
  readonly dayStartMin: number;
  readonly interactive: boolean;
} & HTMLAttributes<HTMLDivElement>;

/** forwardRef + rest-spread so `DropdownMenuTrigger asChild` can wrap a
 *  zone (Radix injects its ref and handlers via Slot). */
const Zone = forwardRef<HTMLDivElement, ZoneProps>((props, ref) => {
  const { zone, dayStartMin, interactive, className, style, ...rest } = props;
  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        'absolute inset-x-0 border-y border-border/80 bg-muted/50 px-2 py-0.5',
        interactive
          ? 'cursor-pointer hover:bg-muted/70'
          : 'pointer-events-none',
        className,
      )}
      style={{
        top: (zone.startMin - dayStartMin) * PX_PER_MIN,
        height: (zone.endMin - zone.startMin) * PX_PER_MIN,
        backgroundImage:
          'repeating-linear-gradient(135deg, transparent, transparent 3px, var(--border) 3px, var(--border) 4px)',
        ...style,
      }}
    >
      <span className="inline-flex max-w-full items-center gap-1 rounded bg-background/90 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
        <Lock className="size-3 shrink-0" />
        <span className="truncate">{zone.label}</span>
        {zone.recurring ? <Repeat className="size-3 shrink-0" /> : null}
      </span>
    </div>
  );
});
Zone.displayName = 'Zone';

export const ZoneLayer = memo(
  ({
    zones,
    dayStartMin,
    interactive,
    onRemoveBlock,
  }: {
    readonly zones: readonly DayZone[];
    readonly dayStartMin: number;
    /** View mode + can schedule: zones open their menu on click. */
    readonly interactive: boolean;
  } & Pick<ScheduleActions, 'onRemoveBlock'>) => (
    <>
      {zones.map((zone) => {
        const rendered = (
          <Zone
            key={zone.id}
            zone={zone}
            dayStartMin={dayStartMin}
            interactive={interactive}
          />
        );
        if (!interactive) return rendered;
        return (
          <DropdownMenu key={zone.id}>
            <DropdownMenuTrigger asChild>{rendered}</DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onRemoveBlock(zone.id)}
              >
                {zone.recurring
                  ? 'Remove block (whole series)'
                  : 'Remove block'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </>
  ),
);
ZoneLayer.displayName = 'ZoneLayer';
