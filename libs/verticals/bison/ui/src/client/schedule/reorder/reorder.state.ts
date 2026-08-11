/**
 * Reorder interaction state for the Schedule screen: active mode, cascade
 * variant, and the local draft layout the drags accumulate into until
 * Apply/Discard. Blocked time enters as immovable walls the rules collide
 * with. View-local by design — nothing leaves until `onApply`.
 */
import { useEffect, useState } from 'react';
import { useReorderDrag } from './reorder.drag';
import { draftDiff } from './reorder.draft';
import { toBlocks, zoneWalls } from './reorder.logic';
import type {
  CascadeVariant,
  ReorderMode,
  ScheduleActions,
  ScheduleBlock,
  ScheduleVM,
} from '../schedule.types';

export const useReorder = (
  vm: ScheduleVM,
  initialMode: 'off' | ReorderMode,
  onApply: ScheduleActions['onApply'],
) => {
  const [mode, setMode] = useState<'off' | ReorderMode>(initialMode);
  const [variant, setVariant] = useState<CascadeVariant>('shift-all');
  const [draft, setDraft] = useState<readonly ScheduleBlock[] | null>(null);
  useEffect(() => setDraft(null), [vm.dateLabel]); // paging discards the draft
  const base = toBlocks(vm.appointments);
  const blocks = draft ?? base;
  const rules =
    mode === 'off'
      ? null
      : {
          mode,
          variant,
          bufferMinutes: vm.bufferMinutes,
          walls: zoneWalls(vm.zones),
        };
  const drag = useReorderDrag({ blocks, rules, onCommit: setDraft });
  const changes = draft ? draftDiff(base, draft) : [];
  const apply = () => {
    onApply(changes);
    setDraft(null);
    setMode('off');
  };
  return {
    mode,
    setMode,
    variant,
    setVariant,
    blocks,
    drag,
    changes,
    apply,
    discard: () => setDraft(null),
  };
};
