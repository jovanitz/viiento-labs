/**
 * Pure aggregation of the client roster from raw appointment history — one
 * row per distinct client name, with their visit count and most recent
 * confirmed visit. Fixture plumbing today, the seed of the future
 * controller logic when the flow is implemented. Search filtering lives in
 * the view (client-side, no backend paging yet).
 */
import type { AppointmentRow } from '../agenda/agenda.types';
import type {
  ChannelStatus,
  ClientChannels,
  ClientRow,
  ClientsVM,
} from './clients.types';

/** One appointment as it actually happened on a real day — the roster needs
 *  the date to pick out the most recent visit; AppointmentRow alone doesn't
 *  carry one (it's day-scoped everywhere else it's used). */
export type DatedAppointment = {
  readonly date: Date;
  readonly dateLabel: string;
  readonly row: AppointmentRow;
};

/** Contact/channel identity for a client — separate from their visit
 *  history, since it doesn't come from appointments (the future real
 *  source is the client's own record, not the schedule). */
export type ClientContact = {
  readonly phone: string;
  readonly photoUrl?: string | undefined;
  readonly channels: ClientChannels;
};

const NO_CONTACT: ClientContact = {
  phone: '',
  channels: { telegram: 'not_connected', whatsapp: 'not_connected' },
};

export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const slugOf = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .split('-')
    .filter(Boolean)
    .join('-');

/** Confirmed visits grouped by client name, most recent first. */
const byClient = (
  visits: readonly DatedAppointment[],
): ReadonlyMap<string, DatedAppointment[]> => {
  const groups = new Map<string, DatedAppointment[]>();
  for (const visit of visits) {
    if (visit.row.status === 'canceled') continue;
    const list = groups.get(visit.row.clientName) ?? [];
    list.push(visit);
    groups.set(visit.row.clientName, list);
  }
  for (const list of groups.values())
    list.sort((a, b) => b.date.getTime() - a.date.getTime());
  return groups;
};

export const deriveClients = (
  visits: readonly DatedAppointment[],
  contacts: ReadonlyMap<string, ClientContact> = new Map(),
): readonly ClientRow[] =>
  Array.from(byClient(visits).entries())
    .map(([name, sorted]) => {
      const latest = sorted[0];
      const id = slugOf(name);
      const contact = contacts.get(id) ?? NO_CONTACT;
      return {
        id,
        name,
        initials: initialsOf(name),
        photoUrl: contact.photoUrl,
        phone: contact.phone,
        channels: contact.channels,
        visitCount: sorted.length,
        latestVisitLabel: latest
          ? `${latest.dateLabel} · ${latest.row.service}`
          : '',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

/** A channel isn't a text field you edit — it's a connection you start,
 *  confirm, and can end. Clicking a channel badge advances it through this
 *  cycle instead of opening a form (see client-identity.header.tsx). */
const CHANNEL_CYCLE: Record<ChannelStatus, ChannelStatus> = {
  not_connected: 'pending',
  pending: 'verified',
  verified: 'not_connected',
};

export const nextChannelStatus = (status: ChannelStatus): ChannelStatus =>
  CHANNEL_CYCLE[status];

export const vmFromClients = (clients: readonly ClientRow[]): ClientsVM => {
  const plural = clients.length === 1 ? '' : 's';
  return {
    clients,
    summary:
      clients.length > 0 ? `${clients.length} client${plural}` : undefined,
    empty: clients.length === 0,
  };
};

export const deriveClientsVM = (
  visits: readonly DatedAppointment[],
  contacts?: ReadonlyMap<string, ClientContact>,
): ClientsVM => vmFromClients(deriveClients(visits, contacts));

/** A client with no visits yet — created directly (roster's "+ New client",
 *  or typed inline while booking) rather than derived from appointment
 *  history. Same identity shape as a visit-derived row, just zeroed out. */
export const newClient = (
  name: string,
  phone = '',
  photoUrl?: string,
): ClientRow => ({
  id: slugOf(name),
  name,
  initials: initialsOf(name),
  photoUrl,
  phone,
  channels: { telegram: 'not_connected', whatsapp: 'not_connected' },
  visitCount: 0,
  latestVisitLabel: '',
});

/** Adds a client by name unless one with the same id already exists (same
 *  slug — e.g. re-typing an existing name in the New-appointment Combobox),
 *  in which case that existing row is reused instead of creating a
 *  duplicate. */
export const addOrGetClient = (
  clients: readonly ClientRow[],
  name: string,
  phone = '',
  photoUrl?: string,
): { clients: readonly ClientRow[]; client: ClientRow; created: boolean } => {
  const existing = clients.find((c) => c.id === slugOf(name));
  if (existing) return { clients, client: existing, created: false };
  const client = newClient(name, phone, photoUrl);
  const next = [...clients, client].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  return { clients: next, client, created: true };
};
