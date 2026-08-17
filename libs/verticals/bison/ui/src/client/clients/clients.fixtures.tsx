/**
 * Fixture ViewModels for the Clients screen. Data only.
 */
import { deriveClientsVM, type DatedAppointment } from './clients.logic';
import { CLIENT_CONTACTS } from './clients.contacts.fixtures';
import type { ClientsVM } from './clients.types';

const visit = (
  date: string,
  clientName: string,
  service: string,
  status: 'confirmed' | 'canceled' = 'confirmed',
): DatedAppointment => ({
  date: new Date(date),
  dateLabel: new Date(date).toDateString(),
  row: {
    id: `${clientName}-${date}`,
    start: '9:00',
    end: '9:45',
    clientName,
    service,
    staffName: 'Marco Vega',
    status,
  },
});

const VISITS: readonly DatedAppointment[] = [
  visit('2026-07-20', 'Diego Marín', 'Classic cut'),
  visit('2026-08-03', 'Diego Marín', 'Classic cut'),
  visit('2026-08-03', 'Luis Peña', 'Beard trim'),
  visit('2026-07-15', 'Emilio Cruz', 'Cut + beard'),
  visit('2026-08-04', 'Emilio Cruz', 'Cut + beard'),
  visit('2026-08-03', 'Andrés Soto', 'Classic cut'),
  visit('2026-08-06', 'Andrés Soto', 'Fade', 'canceled'),
  visit('2026-08-03', 'Javier Luna', 'Color touch-up'),
  visit('2026-08-04', 'Iván Ríos', 'Beard trim'),
];

export const defaultVM: ClientsVM = deriveClientsVM(VISITS, CLIENT_CONTACTS);

export const emptyVM: ClientsVM = deriveClientsVM([]);

/** A busy shop, 200 clients deep — the pagination story (clients.pager.tsx
 *  kicks in past one page's worth of results). */
const MANY_VISITS: readonly DatedAppointment[] = Array.from(
  { length: 200 },
  (_, i) =>
    visit(
      '2026-08-01',
      `Client ${String(i + 1).padStart(3, '0')}`,
      'Classic cut',
    ),
);

export const manyVM: ClientsVM = deriveClientsVM(MANY_VISITS);
