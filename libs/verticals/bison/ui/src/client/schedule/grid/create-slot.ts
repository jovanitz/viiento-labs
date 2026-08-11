/**
 * Click-to-create on the day grid — clicking anywhere in the empty space
 * (nothing else is rendered there — see content-layers.tsx's catcher layer)
 * computes the snapped minute under the pointer and reports it, unconditionally.
 * Creation has no rules of its own: buffer/walls/overlap only govern
 * *reordering* an existing appointment (see schedule/reorder) — on creation
 * the user places it wherever they click. Rect-based, same approach as the
 * reorder drag's own pointer math. Presentational helper of grid.tsx.
 */
import type { MouseEvent, RefObject } from 'react';
import { DAY_START_MIN, PX_PER_MIN, snapMin } from '../schedule.time';

export const useCreateSlotClick = (params: {
  readonly gridRef: RefObject<HTMLElement | null>;
  readonly enabled: boolean;
  readonly onSlot: (startMin: number) => void;
}) => {
  const { gridRef, enabled, onSlot } = params;
  return (e: MouseEvent) => {
    if (!enabled || !gridRef.current) return;
    const gridTop = gridRef.current.getBoundingClientRect().top;
    const startMin = snapMin(
      (e.clientY - gridTop) / PX_PER_MIN + DAY_START_MIN,
    );
    onSlot(startMin);
  };
};
