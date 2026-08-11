/**
 * Pure reorder math for the Schedule screen — mode-aware placement (free /
 * strict / cascade in both variants), overlap column layout for free mode,
 * and draft diffing. Fixture plumbing today, the seed of the future
 * controller when the flow is implemented. No imports beyond types + the
 * shared time constants; runs anywhere.
 */
import type { AppointmentRow } from '../../agenda/agenda.types';
import { DAY_END_MIN, DAY_START_MIN, toMin } from '../schedule.time';
import type {
  CascadeVariant,
  ReorderMode,
  ScheduleBlock,
} from '../schedule.types';

export type Placement = {
  /** Whether the attempted layout is droppable; when false the caller keeps
   *  it only as a red preview and snaps back on release. */
  readonly ok: boolean;
  readonly blocks: readonly ScheduleBlock[];
};

export const toBlocks = (
  rows: readonly AppointmentRow[],
): readonly ScheduleBlock[] =>
  rows
    .filter((r) => r.status !== 'canceled')
    .map((r) => ({
      id: r.id,
      kind: 'appointment' as const,
      startMin: toMin(r.start),
      durationMinutes: toMin(r.end) - toMin(r.start),
      clientName: r.clientName,
      service: r.service,
      staffName: r.staffName,
    }))
    .sort((a, b) => a.startMin - b.startMin);

const endOf = (b: ScheduleBlock) => b.startMin + b.durationMinutes;
const inDay = (b: ScheduleBlock) =>
  b.startMin >= DAY_START_MIN && endOf(b) <= DAY_END_MIN;

/** The required-gap policy applies between two CLIENT appointments; blocked
 *  zones need no buffer around them — they already are dead time. */
const requiredGap = (a: ScheduleBlock, b: ScheduleBlock, buffer: number) =>
  a.kind === 'appointment' && b.kind === 'appointment' ? buffer : 0;

/** Blocked time as immovable pseudo-blocks the collision math understands. */
export const zoneWalls = (
  zones: ReadonlyArray<{ readonly startMin: number; readonly endMin: number }>,
): readonly ScheduleBlock[] =>
  zones.map((z, i) => ({
    id: `wall-${i}`,
    kind: 'zone' as const,
    startMin: z.startMin,
    durationMinutes: z.endMin - z.startMin,
    clientName: '',
    service: '',
    staffName: '',
  }));

/** Overlapping, or closer than the required gap. */
const tooClose = (a: ScheduleBlock, b: ScheduleBlock, buffer: number) => {
  const gap = requiredGap(a, b, buffer);
  return a.startMin < endOf(b) + gap && b.startMin < endOf(a) + gap;
};

const anyTooClose = (blocks: readonly ScheduleBlock[], buffer: number) =>
  blocks.some((a, i) =>
    blocks.slice(i + 1).some((b) => tooClose(a, b, buffer)),
  );

const withChange = (
  blocks: readonly ScheduleBlock[],
  id: string,
  change: Partial<Pick<ScheduleBlock, 'startMin' | 'durationMinutes'>>,
) => blocks.map((b) => (b.id === id ? { ...b, ...change } : b));

/** Every later appointment shifts by the same delta the moved one took.
 *  Walls never move; they only constrain the result. */
const shiftAll = (
  next: readonly ScheduleBlock[],
  before: ScheduleBlock,
  delta: number,
  ctx: {
    readonly buffer: number;
    readonly walls: readonly ScheduleBlock[];
  },
): Placement => {
  const blocks = next.map((b) =>
    b.id === before.id || b.startMin <= before.startMin
      ? b
      : { ...b, startMin: b.startMin + delta },
  );
  return {
    ok:
      blocks.every(inDay) &&
      !anyTooClose([...blocks, ...ctx.walls], ctx.buffer),
    blocks,
  };
};

/** The moved block is pinned where it was dropped; the others yield in start
 *  order, each bumped past whatever it collides with — landing past the
 *  required gap (gaps absorb the shove). Walls are pre-placed and immovable,
 *  so pushed appointments jump over them. */
const pushChain = (
  next: readonly ScheduleBlock[],
  id: string,
  buffer: number,
  walls: readonly ScheduleBlock[],
): Placement => {
  const moved = next.find((b) => b.id === id) as ScheduleBlock;
  const placed: ScheduleBlock[] = [moved, ...walls];
  const others = next
    .filter((b) => b.id !== id)
    .sort((a, b) => a.startMin - b.startMin);
  for (const original of others) {
    let b = original;
    for (let guard = 0; guard < placed.length + others.length; guard += 1) {
      const hit = placed.find((p) => tooClose(p, b, buffer));
      if (!hit) break;
      b = { ...b, startMin: endOf(hit) + requiredGap(hit, b, buffer) };
    }
    placed.push(b);
  }
  const blocks = placed.filter((b) => b.kind !== 'zone');
  return { ok: blocks.every(inDay), blocks };
};

/** Apply a move and/or resize under the active mode's rules. The returned
 *  blocks are the attempted layout either way — valid to commit when `ok`,
 *  a red preview when not. */
export const applyReorder = (
  blocks: readonly ScheduleBlock[],
  id: string,
  change: Partial<Pick<ScheduleBlock, 'startMin' | 'durationMinutes'>>,
  rules: {
    readonly mode: ReorderMode;
    readonly variant: CascadeVariant;
    readonly bufferMinutes: number;
    readonly walls: readonly ScheduleBlock[];
  },
): Placement => {
  const { bufferMinutes: buffer, walls } = rules;
  const before = blocks.find((b) => b.id === id);
  if (!before) return { ok: false, blocks };
  const moved = { ...before, ...change };
  const next = withChange(blocks, id, change);
  if (rules.mode === 'free')
    return {
      ok: inDay(moved) && !walls.some((w) => tooClose(w, moved, buffer)),
      blocks: next,
    };
  if (rules.mode === 'strict')
    return {
      ok:
        inDay(moved) &&
        ![...next, ...walls].some(
          (o) => o.id !== id && tooClose(o, moved, buffer),
        ),
      blocks: next,
    };
  if (rules.variant === 'shift-all') {
    const delta =
      moved.startMin -
      before.startMin +
      (moved.durationMinutes - before.durationMinutes);
    return shiftAll(next, before, delta, { buffer, walls });
  }
  return pushChain(next, id, buffer, walls);
};

/** Column layout for overlapping blocks (free mode): interval clustering —
 *  concurrent blocks share the width, GCal style. */
export const columnLayout = (
  blocks: readonly ScheduleBlock[],
): ReadonlyMap<string, { readonly col: number; readonly cols: number }> => {
  const sorted = [...blocks].sort(
    (a, b) => a.startMin - b.startMin || b.durationMinutes - a.durationMinutes,
  );
  const out = new Map<string, { col: number; cols: number }>();
  let active: Array<{ id: string; end: number; col: number }> = [];
  let cluster: string[] = [];
  let clusterCols = 0;
  const closeCluster = () => {
    for (const cid of cluster) {
      const entry = out.get(cid);
      if (entry) entry.cols = clusterCols;
    }
    cluster = [];
    clusterCols = 0;
  };
  for (const b of sorted) {
    active = active.filter((a) => a.end > b.startMin);
    if (active.length === 0) closeCluster();
    const used = new Set(active.map((a) => a.col));
    let col = 0;
    while (used.has(col)) col += 1;
    active.push({ id: b.id, end: endOf(b), col });
    cluster.push(b.id);
    clusterCols = Math.max(clusterCols, col + 1);
    out.set(b.id, { col, cols: 1 });
  }
  closeCluster();
  return out;
};
