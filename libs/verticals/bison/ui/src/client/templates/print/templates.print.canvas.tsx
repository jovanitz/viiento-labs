/** The printable page — a fixed-size canvas where placed elements can be
 *  dragged anywhere (pointer capture, same idiom as reschedule.drag.ts:
 *  track the delta from pointerdown, commit x/y on every move). No resize
 *  handle yet — position only, kept small for a first pass; add it later
 *  if the layouts actually need it. */
import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { X } from 'lucide-react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './templates.print.logic';
import type { PrintElement } from '../templates.types';

const PrintElementBox = ({
  element,
  onMove,
  onRemove,
}: {
  readonly element: PrintElement;
  readonly onMove: (id: string, x: number, y: number) => void;
  readonly onRemove: (id: string) => void;
}) => {
  const drag = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: element.x,
      origY: element.y,
    };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    onMove(
      element.id,
      drag.current.origX + (e.clientX - drag.current.startX),
      drag.current.origY + (e.clientY - drag.current.startY),
    );
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ left: element.x, top: element.y }}
      className="group absolute flex w-[140px] cursor-grab touch-none flex-col gap-0.5 rounded border border-dashed border-primary/60 bg-background/90 px-2 py-1 active:cursor-grabbing"
    >
      <span className="truncate text-[10px] font-medium uppercase tracking-wide text-primary">
        {element.kind === 'field' ? element.content : 'Text'}
      </span>
      <span className="truncate text-sm text-foreground">
        {element.kind === 'field' ? '—' : element.content}
      </span>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onRemove(element.id)}
        aria-label={`Remove ${element.content}`}
        className="absolute -right-2 -top-2 hidden size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
      >
        <X className="size-3" />
      </button>
    </div>
  );
};

export const PrintCanvas = ({
  elements,
  onMove,
  onRemove,
}: {
  readonly elements: readonly PrintElement[];
  readonly onMove: (id: string, x: number, y: number) => void;
  readonly onRemove: (id: string) => void;
}) => (
  <div
    data-print-area
    className="relative shrink-0 overflow-hidden rounded-md border border-border bg-white shadow-sm"
    style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
  >
    {elements.length === 0 ? (
      <p className="absolute inset-0 flex items-center justify-center px-10 text-center text-sm text-muted-foreground">
        Click a field or text preset to place it on the page.
      </p>
    ) : null}
    {elements.map((element) => (
      <PrintElementBox
        key={element.id}
        element={element}
        onMove={onMove}
        onRemove={onRemove}
      />
    ))}
  </div>
);
