/**
 * Context menu of an appointment block (view mode): cancel. Moving an
 * appointment is Reorder mode's job (the toolbar toggle, drag right on the
 * grid) — not a per-block action here. Presentational helper of grid.tsx.
 */
import type { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@acme/ui';
import type { ScheduleActions, ScheduleBlock } from '../schedule.types';

export const BlockMenu = ({
  block,
  onCancelAppointment,
  children,
}: {
  readonly block: ScheduleBlock;
  readonly children: ReactNode;
} & Pick<ScheduleActions, 'onCancelAppointment'>) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onClick={() => onCancelAppointment(block.id)}
      >
        Cancel appointment
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
