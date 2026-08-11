/**
 * Draft bookkeeping for the reorder flow — diffing the draft layout against
 * the committed day. Pure.
 */
import type { ScheduleBlock, ScheduleChange } from '../schedule.types';

/** Blocks whose time or length differ from the committed day. */
export const draftDiff = (
  base: readonly ScheduleBlock[],
  draft: readonly ScheduleBlock[],
): readonly ScheduleChange[] =>
  draft.flatMap((b) => {
    const original = base.find((o) => o.id === b.id);
    const changed =
      !original ||
      original.startMin !== b.startMin ||
      original.durationMinutes !== b.durationMinutes;
    return changed
      ? [{ id: b.id, startMin: b.startMin, durationMinutes: b.durationMinutes }]
      : [];
  });
