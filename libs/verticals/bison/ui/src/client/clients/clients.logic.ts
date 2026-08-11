/**
 * Pure aggregation of the client roster from raw appointment history — one
 * row per distinct client name, with their visit count and most recent
 * confirmed visit. Fixture plumbing today, the seed of the future
 * controller logic when the flow is implemented. Search filtering lives in
 * the view (client-side, no backend paging yet).
 */
import type { AppointmentRow } from '../agenda/agenda.types';
import type { ClientRow, ClientsVM } from './clients.types';

/** One appointment as it actually happened on a real day — the roster needs
 *  the date to pick out the most recent visit; AppointmentRow alone doesn't
 *  carry one (it's day-scoped everywhere else it's used). */
export type DatedAppointment = {
  readonly date: Date;
  readonly dateLabel: string;
  readonly row: AppointmentRow;
};

const initialsOf = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const slugOf = (name: string): string =>
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
): readonly ClientRow[] =>
  Array.from(byClient(visits).entries())
    .map(([name, sorted]) => {
      const latest = sorted[0];
      return {
        id: slugOf(name),
        name,
        initials: initialsOf(name),
        visitCount: sorted.length,
        latestVisitLabel: latest
          ? `${latest.dateLabel} · ${latest.row.service}`
          : '',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

export const deriveClientsVM = (
  visits: readonly DatedAppointment[],
): ClientsVM => {
  const clients = deriveClients(visits);
  const plural = clients.length === 1 ? '' : 's';
  return {
    clients,
    summary:
      clients.length > 0 ? `${clients.length} client${plural}` : undefined,
    empty: clients.length === 0,
  };
};
