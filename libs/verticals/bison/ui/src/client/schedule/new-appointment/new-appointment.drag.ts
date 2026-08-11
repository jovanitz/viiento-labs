/**
 * Drag interaction for the New-appointment draft block — move and resize it
 * directly on the grid while the popover is still open, same gesture as
 * dragging an existing appointment in Reorder mode. No placement rules to
 * honor here (creation is unrestricted, see create-slot.ts): just snap the
 * pointer to 15-min steps and hand the result to the form's start/end.
 */
import { useRef, type PointerEvent, type RefObject } from 'react';
import {
  DAY_END_MIN,
  DAY_START_MIN,
  MAX_DURATION,
  MIN_DURATION,
  PX_PER_MIN,
  snapMin,
} from '../schedule.time';

type Session = {
  readonly mode: 'move' | 'resize';
  readonly gridTop: number;
  readonly grabOffsetMin: number;
  readonly startMin: number;
  readonly duration: number;
  last: number;
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const pointerMin = (e: PointerEvent, gridTop: number) =>
  (e.clientY - gridTop) / PX_PER_MIN + DAY_START_MIN;

export const useDraftDrag = (params: {
  readonly gridRef: RefObject<HTMLElement | null>;
  readonly startMin: number;
  readonly endMin: number;
  /** Moving slides both ends by the same delta — the hook (not the caller)
   *  owns the duration-preserving math, so it hands over the already-paired
   *  start/end. */
  readonly onMove: (startMin: number, endMin: number) => void;
  readonly onResize: (endMin: number) => void;
}) => {
  const { gridRef, startMin, endMin, onMove, onResize } = params;
  const session = useRef<Session | null>(null);

  const begin = (e: PointerEvent, mode: 'move' | 'resize') => {
    if (!gridRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const gridTop = gridRef.current.getBoundingClientRect().top;
    session.current = {
      mode,
      gridTop,
      grabOffsetMin: startMin - pointerMin(e, gridTop),
      startMin,
      duration: endMin - startMin,
      last: mode === 'move' ? startMin : endMin - startMin,
    };
  };

  const move = (e: PointerEvent) => {
    const s = session.current;
    if (!s) return;
    const raw = pointerMin(e, s.gridTop);
    if (s.mode === 'move') {
      const next = clamp(
        snapMin(raw + s.grabOffsetMin),
        DAY_START_MIN,
        DAY_END_MIN - s.duration,
      );
      if (next === s.last) return;
      s.last = next;
      onMove(next, next + s.duration);
    } else {
      const next = clamp(
        snapMin(raw) - s.startMin,
        MIN_DURATION,
        Math.min(MAX_DURATION, DAY_END_MIN - s.startMin),
      );
      if (next === s.last) return;
      s.last = next;
      onResize(s.startMin + next);
    }
  };

  const end = () => {
    session.current = null;
  };

  return {
    moveHandlers: {
      onPointerDown: (e: PointerEvent) => begin(e, 'move'),
      onPointerMove: move,
      onPointerUp: end,
      onPointerCancel: end,
    },
    resizeHandlers: {
      onPointerDown: (e: PointerEvent) => {
        e.stopPropagation();
        begin(e, 'resize');
      },
      onPointerMove: move,
      onPointerUp: end,
      onPointerCancel: end,
    },
  };
};
