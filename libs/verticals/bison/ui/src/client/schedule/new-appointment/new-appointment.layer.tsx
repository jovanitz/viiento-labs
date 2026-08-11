/**
 * Grid-level wiring for the New-appointment draft block — instantiates the
 * form hook and the drag hook (move/resize the draft right on the grid while
 * it's open) here, and renders the draft block + its anchored popover. Split
 * out of content-layers.tsx to keep that file under the line limit.
 */
import type { RefObject } from 'react';
import type { NewAppointment } from '../schedule.types';
import { useDraftDrag } from './new-appointment.drag';
import { DraftAppointmentBlock } from './new-appointment.block';
import { useAppointmentForm } from './new-appointment.form';

export const NewAppointmentLayer = ({
  open,
  onOpenChange,
  initialStartMin,
  dayStartMin,
  gridRef,
  onCreateAppointment,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly initialStartMin: number;
  readonly dayStartMin: number;
  readonly gridRef: RefObject<HTMLElement | null>;
  readonly onCreateAppointment: (appointment: NewAppointment) => void;
}) => {
  const form = useAppointmentForm({
    open,
    initialStartMin,
    onCreate: onCreateAppointment,
    close: () => onOpenChange(false),
  });
  const drag = useDraftDrag({
    gridRef,
    startMin: form.startMin,
    endMin: form.endMin,
    onMove: (start, end) => {
      form.setStartMin(start);
      form.setEndMin(end);
    },
    onResize: form.setEndMin,
  });
  return (
    <DraftAppointmentBlock
      open={open}
      onOpenChange={onOpenChange}
      dayStartMin={dayStartMin}
      form={form}
      drag={drag}
    />
  );
};
