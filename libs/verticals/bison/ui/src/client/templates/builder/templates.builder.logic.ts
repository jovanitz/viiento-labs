/** Pure block-list operations for the Template Builder. Data only, no
 *  framework — the canvas/container wire these to drag events and state. */
import { CHOICE_KINDS } from '../templates.types';
import type { FieldKind, TemplateBlock } from '../templates.types';
import { BLOCK_CATALOG } from './palette/templates.block-catalog';

/** `dataTransfer` MIME for dragging a NEW block in from the palette. */
export const PALETTE_DRAG_MIME = 'application/x-bison-new-block';
/** `dataTransfer` MIME for dragging an EXISTING canvas block to reorder. */
export const REORDER_DRAG_MIME = 'application/x-bison-move-block';

const labelFor = (kind: FieldKind) =>
  BLOCK_CATALOG.find((entry) => entry.kind === kind)?.label ?? 'Field';

/** A fresh block with sane defaults for its kind. IDs are derived from the
 *  current block count (same idiom as client.prototype.schedule.tsx's
 *  `cb-${blocks.length + 1}`) — fine for a prototype, not a durability
 *  guarantee. */
export const createBlock = (
  kind: FieldKind,
  existing: readonly TemplateBlock[],
): TemplateBlock => {
  const id = `${kind}-${existing.length + 1}`;
  if (kind === 'help-text')
    return { id, kind, label: 'Add some help text…', width: 'full' };
  if (kind === 'section') return { id, kind, label: 'Section', width: 'full' };
  if (CHOICE_KINDS.includes(kind))
    return {
      id,
      kind,
      label: labelFor(kind),
      width: 'full',
      required: false,
      options: ['Option 1', 'Option 2'],
    };
  return { id, kind, label: labelFor(kind), width: 'full', required: false };
};

export const insertBlock = (
  blocks: readonly TemplateBlock[],
  block: TemplateBlock,
  atIndex: number,
): readonly TemplateBlock[] => {
  const next = [...blocks];
  next.splice(atIndex, 0, block);
  return next;
};

export const removeBlock = (
  blocks: readonly TemplateBlock[],
  id: string,
): readonly TemplateBlock[] => blocks.filter((b) => b.id !== id);

export const updateBlock = (
  blocks: readonly TemplateBlock[],
  id: string,
  patch: Partial<TemplateBlock>,
): readonly TemplateBlock[] =>
  blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));

/** `toIndex` is the position in the CURRENT (pre-removal) array to drop
 *  before — the caller (canvas) is responsible for the "dropped past its
 *  own old slot shifts everything left by one" adjustment, since that's an
 *  interaction-layer concern, not a data one. */
export const moveBlock = (
  blocks: readonly TemplateBlock[],
  fromIndex: number,
  toIndex: number,
): readonly TemplateBlock[] => {
  if (fromIndex === toIndex) return blocks;
  const next = [...blocks];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved!);
  return next;
};
