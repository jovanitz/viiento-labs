/** Pure element-list operations for the Print layout canvas. Data only —
 *  the canvas wires these to pointer-drag events. Positions are raw px
 *  within a fixed-size canvas (CANVAS_WIDTH x CANVAS_HEIGHT), scaled to
 *  roughly a Letter page's aspect ratio. */
import { STRUCTURAL_KINDS } from '../templates.types';
import type {
  PrintElement,
  PrintElementKind,
  TemplateBlock,
} from '../templates.types';

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 620;
const ELEMENT_WIDTH = 140;
const ELEMENT_HEIGHT = 44;
const GRID_GAP = 16;
const COLUMNS = 3;

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);

/** New elements land in a simple grid so they never stack exactly on top
 *  of each other — the author drags them wherever they actually want. */
export const addElement = (
  elements: readonly PrintElement[],
  kind: PrintElementKind,
  content: string,
  blockId?: string,
): readonly PrintElement[] => {
  const index = elements.length;
  const col = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  const element: PrintElement = {
    id: `el-${index + 1}`,
    kind,
    blockId,
    content,
    x: GRID_GAP + col * (ELEMENT_WIDTH + GRID_GAP),
    y: GRID_GAP + row * (ELEMENT_HEIGHT + GRID_GAP),
  };
  return [...elements, element];
};

export const moveElement = (
  elements: readonly PrintElement[],
  id: string,
  x: number,
  y: number,
): readonly PrintElement[] =>
  elements.map((el) =>
    el.id === id
      ? {
          ...el,
          x: clamp(x, CANVAS_WIDTH - ELEMENT_WIDTH),
          y: clamp(y, CANVAS_HEIGHT - ELEMENT_HEIGHT),
        }
      : el,
  );

export const removeElement = (
  elements: readonly PrintElement[],
  id: string,
): readonly PrintElement[] => elements.filter((el) => el.id !== id);

/** Fields available to place — structural blocks (section/help-text) never
 *  hold a value, so they don't belong on a printed page. */
export const printableBlocks = (
  blocks: readonly TemplateBlock[],
): readonly TemplateBlock[] =>
  blocks.filter((b) => !STRUCTURAL_KINDS.includes(b.kind));
