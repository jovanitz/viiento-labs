/**
 * The Builder canvas — the ordered block list being built. Owns the drag
 * interaction: dropping a palette chip inserts a new block at that
 * position; dragging a row's handle over another row reorders. Both paths
 * funnel through one `onDropAt(index)` so the insert-position math lives in
 * one place.
 */
import { useState, type DragEvent } from 'react';
import { FilePlus2 } from 'lucide-react';
import { EmptyState, cn } from '@acme/ui';
import { BuilderBlockRow } from './templates.builder.block-row';
import {
  PALETTE_DRAG_MIME,
  REORDER_DRAG_MIME,
} from '../templates.builder.logic';
import type { TemplateBlock } from '../../templates.types';

const EmptyCanvas = ({
  onDrop,
}: {
  readonly onDrop: (e: DragEvent) => void;
}) => (
  <div
    onDragOver={(e) => e.preventDefault()}
    onDrop={onDrop}
    className="flex-1"
  >
    <EmptyState
      icon={<FilePlus2 />}
      title="Drag a block in, or click one in the palette"
      description="Start with a Section if this form has more than one part."
    />
  </div>
);

/** Fills all the leftover canvas space below the last block — not just a
 *  thin strip — so dropping "at the end" doesn't need pixel-precise
 *  aim right under the last row. */
const TrailingDropZone = ({
  active,
  onDragOver,
  onDrop,
}: {
  readonly active: boolean;
  readonly onDragOver: (e: DragEvent<HTMLLIElement>) => void;
  readonly onDrop: (e: DragEvent<HTMLLIElement>) => void;
}) => (
  <li
    onDragOver={onDragOver}
    onDrop={onDrop}
    className={cn(
      'min-h-8 flex-1 rounded-md border-t-2 border-t-transparent',
      active && 'border-t-primary',
    )}
  />
);

export const BuilderCanvas = ({
  blocks,
  onInsertKind,
  onReorder,
  onChangeBlock,
  onRemoveBlock,
}: {
  readonly blocks: readonly TemplateBlock[];
  readonly onInsertKind: (kind: string, atIndex: number) => void;
  readonly onReorder: (fromIndex: number, toIndex: number) => void;
  readonly onChangeBlock: (id: string, patch: Partial<TemplateBlock>) => void;
  readonly onRemoveBlock: (id: string) => void;
}) => {
  const [dragOverIndex, setDragOverIndex] = useState<number>();

  const dropAt = (e: DragEvent, atIndex: number) => {
    e.preventDefault();
    setDragOverIndex(undefined);
    const newKind = e.dataTransfer.getData(PALETTE_DRAG_MIME);
    if (newKind) return onInsertKind(newKind, atIndex);
    const movedId = e.dataTransfer.getData(REORDER_DRAG_MIME);
    const fromIndex = blocks.findIndex((b) => b.id === movedId);
    if (fromIndex === -1) return;
    // Removing `fromIndex` shifts everything after it left by one, so
    // dropping past its own old slot needs the target nudged back.
    const toIndex = fromIndex < atIndex ? atIndex - 1 : atIndex;
    onReorder(fromIndex, toIndex);
  };

  if (blocks.length === 0) return <EmptyCanvas onDrop={(e) => dropAt(e, 0)} />;

  return (
    <ol className="flex min-h-[420px] flex-1 flex-col">
      {blocks.map((block, index) => (
        <BuilderBlockRow
          key={block.id}
          block={block}
          dragOver={dragOverIndex === index}
          onRowDragOver={(e) => {
            e.preventDefault();
            setDragOverIndex(index);
          }}
          onRowDrop={(e) => dropAt(e, index)}
          onHandleDragStart={(e) => {
            e.dataTransfer.setData(REORDER_DRAG_MIME, block.id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onHandleDragEnd={() => undefined}
          onChange={(patch) => onChangeBlock(block.id, patch)}
          onRemove={() => onRemoveBlock(block.id)}
        />
      ))}
      <TrailingDropZone
        active={dragOverIndex === blocks.length}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverIndex(blocks.length);
        }}
        onDrop={(e) => dropAt(e, blocks.length)}
      />
    </ol>
  );
};
