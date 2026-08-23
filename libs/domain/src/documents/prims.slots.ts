/**
 * Slot → positioned primitives, one presenter per kind (ADR-0020 §5) —
 * the drawing half of the theme's presenters, mirroring ui render/
 * document.slots.tsx.
 */
import { DOC_HAIRLINE, DOC_INK, DOC_INK_MUTED } from './model';
import type { DocumentSlot } from './model';
import { wrapText } from './measure';
import type { TextStyle } from './measure';
import { IMAGE_MAX_H } from './heights';
import { emitLabel, textLines } from './prims.types';
import type { SlotBox } from './prims.types';

const valuePrims = (
  box: SlotBox,
  slot: Extract<DocumentSlot, { kind: 'field' | 'token' }>,
): void => {
  const { theme } = box.ctx;
  const boxed = theme.fieldRule === 'box';
  const inner = boxed ? box.w - 12 : box.w;
  const innerX = boxed ? box.x + 6 : box.x;
  let y = box.y + (boxed ? 5 : 0);
  y += emitLabel({ ...box, x: innerX, y }, slot.label);
  const text =
    theme.labels === 'inline' ? `${slot.label}: ${slot.value}` : slot.value;
  const lineH = theme.basePt * (slot.multiline === true ? 1.55 : 1.3);
  const style: TextStyle = {
    family: theme.family,
    sizePt: theme.basePt,
    weight: 400,
  };
  const lines = wrapText(text, style, inner, box.ctx.measure);
  lines.forEach((line, i) =>
    box.emit({
      kind: 'text',
      x: innerX,
      y: y + i * lineH,
      text: line,
      sizePt: theme.basePt,
      weight: 400,
      color: DOC_INK,
      lineH,
    }),
  );
  const bottom = y + lines.length * lineH;
  if (theme.fieldRule === 'underline') {
    box.emit({
      kind: 'line',
      x1: box.x,
      y1: bottom + 2.5,
      x2: box.x + box.w,
      y2: bottom + 2.5,
      color: DOC_HAIRLINE,
      width: 1,
    });
  }
  if (boxed) {
    box.emit({
      kind: 'rect',
      x: box.x,
      y: box.y,
      w: box.w,
      h: bottom + 5 - box.y,
      stroke: DOC_HAIRLINE,
    });
  }
};

const checklistPrims = (
  box: SlotBox,
  slot: Extract<DocumentSlot, { kind: 'checklist' }>,
): void => {
  const { theme } = box.ctx;
  let y = box.y + emitLabel(box, slot.label) + 4;
  const side = theme.basePt * 0.95;
  for (const item of slot.items) {
    const color = item.checked ? theme.accent : DOC_HAIRLINE;
    box.emit({
      kind: 'rect',
      x: box.x,
      y: y + 1,
      w: side,
      h: side,
      stroke: color,
    });
    // The check mark: two strokes, as in the SVG presenter.
    const strokes: ReadonlyArray<readonly [number, number, number, number]> =
      item.checked
        ? [
            [0.25, 0.53, 0.44, 0.7],
            [0.44, 0.7, 0.75, 0.36],
          ]
        : [];
    for (const [a, b, c, d] of strokes) {
      box.emit({
        kind: 'line',
        x1: box.x + side * a,
        y1: y + 1 + side * b,
        x2: box.x + side * c,
        y2: y + 1 + side * d,
        color: theme.accent,
        width: 1.4,
      });
    }
    const textX = box.x + side + 5;
    const used = textLines(
      { ...box, x: textX, w: box.w - side - 5 },
      item.text,
      { sizePt: theme.basePt, weight: 400, color: DOC_INK },
      y,
    );
    y += Math.max(used, side) + 4;
  }
};

const signaturePrims = (
  box: SlotBox,
  slot: Extract<DocumentSlot, { kind: 'signature' }>,
): void => {
  const { theme } = box.ctx;
  const lineY = box.y + 27;
  box.emit({
    kind: 'line',
    x1: box.x,
    y1: lineY,
    x2: box.x + box.w,
    y2: lineY,
    color: DOC_INK,
    width: 1,
  });
  const nameY = lineY + 4;
  const nameH = textLines(
    box,
    slot.name,
    { sizePt: theme.basePt, weight: 600, color: DOC_INK },
    nameY,
  );
  textLines(
    box,
    slot.label,
    { sizePt: theme.basePt * 0.75, weight: 400, color: DOC_INK_MUTED },
    nameY + nameH + 2,
  );
};

const filePrims = (
  box: SlotBox,
  slot: Extract<DocumentSlot, { kind: 'file' }>,
): void => {
  const { theme } = box.ctx;
  const y = box.y + emitLabel(box, slot.label) + 3;
  if (slot.isImage && slot.dataUrl !== undefined) {
    box.emit({
      kind: 'image',
      x: box.x,
      y,
      w: box.w,
      h: IMAGE_MAX_H,
      dataUrl: slot.dataUrl,
    });
    return;
  }
  const h = theme.basePt * 1.3 + 8;
  const w = Math.min(
    box.w,
    box.ctx.measure(slot.name, {
      family: theme.family,
      sizePt: theme.basePt,
      weight: 400,
    }) + 12,
  );
  box.emit({ kind: 'rect', x: box.x, y, w, h, stroke: DOC_HAIRLINE });
  box.emit({
    kind: 'text',
    x: box.x + 6,
    y: y + 4,
    text: slot.name,
    sizePt: theme.basePt,
    weight: 400,
    color: DOC_INK,
    lineH: theme.basePt * 1.3,
  });
};

/** Emit one slot's primitives at (x, y) in a column w points wide. */
export const slotPrims = (box: SlotBox, slot: DocumentSlot): void => {
  const { theme } = box.ctx;
  switch (slot.kind) {
    case 'spacer':
      return;
    case 'static':
      textLines(
        box,
        slot.text,
        { sizePt: theme.basePt * 0.85, weight: 400, color: DOC_INK_MUTED },
        box.y,
      );
      return;
    case 'signature':
      signaturePrims(box, slot);
      return;
    case 'checklist':
      checklistPrims(box, slot);
      return;
    case 'file':
      filePrims(box, slot);
      return;
    default:
      valuePrims(box, slot);
  }
};
