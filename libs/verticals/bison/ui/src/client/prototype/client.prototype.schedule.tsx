/**
 * Schedule simulation for the navigable prototype — the grid-first agenda as
 * the main view. Day paging over the fixture days; the Reorder modes edit a
 * local draft that commits in batch via Apply (with Undo) — the only way to
 * move an appointment, no per-block "Reschedule" action; "Block time"
 * creates calendar blocks (one-off, daily or per-weekday, up to all-day)
 * that every rule treats as walls; block menus just cancel. No real logic;
 * the real app moves this into stores + flows.
 */
import { useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from '@acme/ui';
import { ScheduleView } from '../schedule/schedule.view';
import type { ClientRow } from '../clients/clients.types';
import type {
  NewAppointment,
  NewCalendarBlock,
  ScheduleChange,
} from '../schedule/schedule.types';
import type { CalendarBlock } from '../schedule/blocks/blocks.logic';
import type { AppointmentRow } from '../agenda/agenda.types';
import { toLabel } from '../schedule/schedule.time';
import {
  DAYS,
  TODAY_IDX,
  deriveScheduleVM,
  type AddedAppointment,
  type Move,
} from './client.prototype.logic';

type Moves = Readonly<Record<string, Move>>;

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const removeCanceled = (
  setCanceled: Dispatch<SetStateAction<readonly string[]>>,
  id: string,
) => setCanceled((c) => c.filter((x) => x !== id));

/** Fold an Apply batch into the moves map (everything stays on this day). */
const withChanges = (
  moves: Moves,
  dayIdx: number,
  changes: readonly ScheduleChange[],
): Moves => {
  const next = { ...moves };
  for (const c of changes)
    next[c.id] = {
      dayIdx,
      startMin: c.startMin,
      durationMinutes: c.durationMinutes,
    };
  return next;
};

const removeBlockById = (
  setBlocks: Dispatch<SetStateAction<readonly CalendarBlock[]>>,
  id: string,
) => setBlocks((b) => b.filter((x) => x.id !== id));

const removeAddedById = (
  setAdded: Dispatch<SetStateAction<readonly AddedAppointment[]>>,
  id: string,
) => setAdded((a) => a.filter((x) => x.row.id !== id));

const createAppointment = (
  dayIdx: number,
  added: readonly AddedAppointment[],
  setAdded: Dispatch<SetStateAction<readonly AddedAppointment[]>>,
  appt: NewAppointment,
) => {
  const id = `apt-${added.length + 1}`;
  const row: AppointmentRow = {
    id,
    start: toLabel(appt.startMin),
    end: toLabel(appt.startMin + appt.durationMinutes),
    clientName: appt.clientName,
    service: appt.service,
    staffName: appt.staffName,
    status: 'confirmed',
  };
  setAdded((a) => [...a, { dayIdx, row }]);
  toast.success(`Booked ${appt.clientName} · ${row.start}`, {
    action: { label: 'Undo', onClick: () => removeAddedById(setAdded, id) },
  });
};

const makeCancel =
  (setCanceled: Dispatch<SetStateAction<readonly string[]>>) =>
  (id: string) => {
    setCanceled((c) => [...c, id]);
    toast.success('Appointment canceled', {
      action: {
        label: 'Undo',
        onClick: () => removeCanceled(setCanceled, id),
      },
    });
  };

/** All the click-through's persistent state + toast-confirmed mutations. */
const useSim = () => {
  const [dayIdx, setDayIdx] = useState(TODAY_IDX);
  const [moves, setMoves] = useState<Moves>({});
  const [blocks, setBlocks] = useState<readonly CalendarBlock[]>([]);
  const [canceled, setCanceled] = useState<readonly string[]>([]);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [added, setAdded] = useState<readonly AddedAppointment[]>([]);
  const overrides = { moves, canceled, blocks, added };

  const applyBatch = (changes: readonly ScheduleChange[]) => {
    if (changes.length === 0) return;
    const previous = moves;
    setMoves((m) => withChanges(m, dayIdx, changes));
    const plural = changes.length === 1 ? '' : 's';
    toast.success(`${changes.length} change${plural} applied`, {
      action: { label: 'Undo', onClick: () => setMoves(previous) },
    });
  };

  const addBlock = (block: NewCalendarBlock) => {
    const id = `cb-${blocks.length + 1}`;
    setBlocks((b) => [...b, { ...block, id }]);
    toast.success(`"${block.label}" blocked`, {
      action: {
        label: 'Undo',
        onClick: () => removeBlockById(setBlocks, id),
      },
    });
  };

  const removeBlock = (id: string) => {
    const previous = blocks;
    removeBlockById(setBlocks, id);
    toast.success('Block removed', {
      action: { label: 'Undo', onClick: () => setBlocks(previous) },
    });
  };

  return {
    dayIdx,
    setDayIdx,
    overrides,
    bufferMinutes,
    setBufferMinutes,
    applyBatch,
    addBlock,
    removeBlock,
    cancelAppointment: makeCancel(setCanceled),
    addAppointment: (appt: NewAppointment) =>
      createAppointment(dayIdx, added, setAdded, appt),
  };
};

export const ScheduleSim = ({
  clients,
  onCreateClient,
  onOpenClient,
}: {
  readonly clients: readonly ClientRow[];
  readonly onCreateClient: (name: string) => ClientRow;
  readonly onOpenClient: (clientName: string) => void;
}) => {
  const sim = useSim();
  return (
    <ScheduleView
      vm={deriveScheduleVM(sim.dayIdx, sim.overrides, sim.bufferMinutes)}
      onSelectDay={(id) => sim.setDayIdx(clamp(Number(id), 0, DAYS.length - 1))}
      onCreateAppointment={sim.addAppointment}
      onCancelAppointment={sim.cancelAppointment}
      onOpenClient={onOpenClient}
      onBlockTime={sim.addBlock}
      onRemoveBlock={sim.removeBlock}
      onBufferChange={sim.setBufferMinutes}
      onApply={sim.applyBatch}
      onRetry={() =>
        toast('Still unreachable — this day simulates the error path')
      }
      clients={clients}
      onCreateClient={onCreateClient}
    />
  );
};
