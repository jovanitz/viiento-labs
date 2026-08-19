/**
 * Context menu of an appointment block (view mode): open the client's
 * record, or cancel. Moving an
 * appointment is Reorder mode's job (the toolbar toggle, drag right on the
 * grid) — not a per-block action here. Presentational helper of grid.tsx.
 */
import type { ReactNode } from 'react';
import { UserRound } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@acme/ui';
import type { ScheduleActions, ScheduleBlock } from '../schedule.types';

export const BlockMenu = ({
  block,
  onCancelAppointment,
  onOpenClient,
  children,
}: {
  readonly block: ScheduleBlock;
  readonly children: ReactNode;
} & Pick<ScheduleActions, 'onCancelAppointment' | 'onOpenClient'>) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      {block.kind === 'appointment' ? (
        <>
          <DropdownMenuItem onClick={() => onOpenClient(block.clientName)}>
            <UserRound /> Open client timeline
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      ) : null}
      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onClick={() => onCancelAppointment(block.id)}
      >
        Cancel appointment
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
