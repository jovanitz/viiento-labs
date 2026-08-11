/**
 * Reorder drag for the Schedule grid — every block is draggable/resizable
 * while a reorder mode is active, and each snapped position runs through the
 * mode's placement rules (schedule.logic) to produce a live preview layout
 * (cascade shows the other blocks shifting in real time).
 *
 * Performance contract: state changes only when the snapped value crosses a
 * 15-min boundary (placement math runs at snap frequency, never per pixel),
 * the grid rect is read once at drag start, and pointer capture keeps
 * everything off window listeners.
 */
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  DAY_END_MIN,
  DAY_START_MIN,
  MAX_DURATION,
  MIN_DURATION,
  PX_PER_MIN,
  snapMin,
} from '../schedule.time';
import { applyReorder, type Placement } from './reorder.logic';
import type {
  CascadeVariant,
  ReorderMode,
  ScheduleBlock,
} from '../schedule.types';

export type ReorderRules = {
  readonly mode: ReorderMode;
  readonly variant: CascadeVariant;
  readonly bufferMinutes: number;
  /** Blocked time as immovable pseudo-blocks (see zoneWalls). */
  readonly walls: readonly ScheduleBlock[];
};

export type ReorderPreview = Placement & { readonly movedId: string };

type Session = {
  readonly id: string;
  readonly kind: 'move' | 'resize';
  readonly gridTop: number;
  readonly grabOffsetMin: number;
  readonly base: ScheduleBlock;
  last: number;
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const pointerMin = (e: PointerEvent, gridTop: number) =>
  (e.clientY - gridTop) / PX_PER_MIN + DAY_START_MIN;

const nextFor = (s: Session, raw: number): number =>
  s.kind === 'move'
    ? clamp(
        snapMin(raw + s.grabOffsetMin),
        DAY_START_MIN,
        DAY_END_MIN - s.base.durationMinutes,
      )
    : clamp(
        snapMin(raw) - s.base.startMin,
        MIN_DURATION,
        Math.min(MAX_DURATION, DAY_END_MIN - s.base.startMin),
      );

export const useReorderDrag = (params: {
  readonly blocks: readonly ScheduleBlock[];
  readonly rules: ReorderRules | null;
  readonly onCommit: (next: readonly ScheduleBlock[]) => void;
}) => {
  const { blocks, rules, onCommit } = params;
  const [preview, setPreview] = useState<ReorderPreview | null>(null);
  const session = useRef<Session | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Leaving reorder mode (or switching its rules) drops any live preview.
  useEffect(() => {
    session.current = null;
    setPreview(null);
  }, [rules?.mode, rules?.variant]);

  const begin = (e: PointerEvent, id: string, kind: 'move' | 'resize') => {
    const base = blocks.find((b) => b.id === id);
    if (!rules || !base || !gridRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const gridTop = gridRef.current.getBoundingClientRect().top;
    session.current = {
      id,
      kind,
      gridTop,
      grabOffsetMin: base.startMin - pointerMin(e, gridTop),
      base,
      last: kind === 'move' ? base.startMin : base.durationMinutes,
    };
  };

  const move = (e: PointerEvent) => {
    const s = session.current;
    if (!s || !rules) return;
    const next = nextFor(s, pointerMin(e, s.gridTop));
    if (next === s.last) return;
    s.last = next;
    const change =
      s.kind === 'move' ? { startMin: next } : { durationMinutes: next };
    setPreview({ ...applyReorder(blocks, s.id, change, rules), movedId: s.id });
  };

  const end = () => {
    if (!session.current) return;
    session.current = null;
    if (preview?.ok) onCommit(preview.blocks);
    setPreview(null); // invalid drops just vanish — the base layout snaps back
  };

  const moveHandlers = (id: string) => ({
    onPointerDown: (e: PointerEvent) => begin(e, id, 'move'),
    onPointerMove: move,
    onPointerUp: end,
    onPointerCancel: end,
  });

  const resizeHandlers = (id: string) => ({
    onPointerDown: (e: PointerEvent) => {
      e.stopPropagation();
      begin(e, id, 'resize');
    },
    onPointerMove: move,
    onPointerUp: end,
    onPointerCancel: end,
  });

  return { gridRef, preview, moveHandlers, resizeHandlers };
};
