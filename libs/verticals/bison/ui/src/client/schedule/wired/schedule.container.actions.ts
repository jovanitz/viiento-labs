import { toast } from '@acme/ui';
import type { ClientRowVM } from '@acme/bison-application';
import { localDate, type AgendaStore } from '../../store/agenda-store';
import type {
  NewAppointment,
  NewCalendarBlock,
  ScheduleChange,
} from '../schedule.types';
import type { ClientRow } from '../../clients/clients.types';

/** Store-delegating action handlers + roster plumbing for the wired
 *  Schedule — kept out of the component so it reads as wiring. */

/** Optimistic row for the combobox's inline "Create" — the REAL creation
 *  happens once, at booking time (see agenda-store.clientIdByName). */
export const optimisticRow = (name: string): ClientRow => ({
  id: `pending:${name}`,
  name,
  initials: name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join(''),
  phone: '',
  channels: { telegram: 'not_connected', whatsapp: 'not_connected' },
  visitCount: 0,
  latestVisitLabel: '',
});

/** The dialog resolves its selection against THIS list, so inline-created
 *  (not yet persisted) rows must appear here; once the roster reload knows
 *  the name, the pending twin drops out. */
export const toClientRows = (
  clients: ReadonlyArray<ClientRowVM> | null,
  pending: readonly ClientRow[],
): readonly ClientRow[] => {
  const roster = clients ?? [];
  const known = new Set(roster.map((c) => c.name));
  return [...roster, ...pending.filter((p) => !known.has(p.name))];
};

/** Individual mode: the booking is implicitly the OWNER's — the real
 *  session name replaces the prototype's fixture person when known. */
export const bookAsOwner = (
  store: AgendaStore,
  ownerName: string | undefined,
  appointment: NewAppointment,
) =>
  bookVia(store, {
    ...appointment,
    ...(ownerName !== undefined ? { staffName: ownerName } : {}),
  });

export const bookVia = async (
  store: AgendaStore,
  appointment: NewAppointment,
) => {
  const booked = await store.getState().book({
    clientName: appointment.clientName,
    service: appointment.service,
    staffName: appointment.staffName,
    startMin: appointment.startMin,
    durationMinutes: appointment.durationMinutes,
  });
  if (booked) toast.success(`Booked ${appointment.clientName}`);
  else toast.error(store.getState().error ?? 'Booking failed');
};

export const cancelVia = async (store: AgendaStore, id: string) => {
  const done = await store.getState().cancel(id);
  if (done) toast.success('Appointment canceled');
};

export const applyVia = async (
  store: AgendaStore,
  changes: readonly ScheduleChange[],
) => {
  if (changes.length === 0) return;
  const applied = await store.getState().applyMoves(changes);
  const plural = applied === 1 ? '' : 's';
  if (applied > 0) toast.success(`${applied} change${plural} applied`);
  if (applied < changes.length) {
    toast.error(store.getState().error ?? 'Some moves failed');
  }
};

export const blockVia = async (store: AgendaStore, block: NewCalendarBlock) => {
  const added = await store.getState().addBlock({
    label: block.label,
    allDay: block.allDay,
    startMin: block.startMin,
    endMin: block.endMin,
    dates:
      block.dates.kind === 'range'
        ? {
            kind: 'range',
            start: localDate(block.dates.start),
            end: localDate(block.dates.end),
          }
        : block.dates,
  });
  if (added) toast.success(`"${block.label}" blocked`);
  else toast.error(store.getState().error ?? 'Block failed');
};

export const removeBlockVia = async (store: AgendaStore, id: string) => {
  const done = await store.getState().removeBlock(id);
  if (done) toast.success('Block removed');
};
