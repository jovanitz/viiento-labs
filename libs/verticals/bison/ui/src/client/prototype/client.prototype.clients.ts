/**
 * Client roster for the navigable prototype — every confirmed appointment
 * across the whole fixture window (past + future days) aggregated into one
 * row per client, plus a batch of synthetic extra clients (see EXTRA below)
 * so the roster is big enough to exercise pagination in the actual
 * click-through, not only in Storybook's ManyClients story. Derived from
 * the base fixture only, not the live Schedule session's local edits
 * (moves/added/canceled) — those live inside ScheduleSim's own state, and
 * wiring them in means lifting it up to this composition root. Left for
 * when this section needs it for real.
 */
import {
  deriveClientsVM,
  type DatedAppointment,
} from '../clients/clients.logic';
import { CLIENT_CONTACTS } from '../clients/clients.contacts.fixtures';
import type { ClientsVM } from '../clients/clients.types';
import type { OwnerProfile } from '../settings/settings.types';
import { DAYS, dateAt, dateLabelOf } from './client.prototype.days';

const realVisits: readonly DatedAppointment[] = DAYS.flatMap((day, dayIdx) =>
  day.loading || day.error
    ? []
    : day.appointments.map((row) => ({
        date: dateAt(dayIdx),
        dateLabel: day.dateLabel,
        row,
      })),
);

/** Enough made-up clients to push the roster past one page of 20 (see
 *  clients.pager.tsx) — a demo prop, not meant to look like a curated
 *  fixture. Names cycle two pools with a coprime stride so 40-odd
 *  combinations don't repeat identically. */
const FIRST_NAMES = [
  'Carlos',
  'José',
  'Miguel',
  'Fernando',
  'Ricardo',
  'Alejandro',
  'Roberto',
  'Manuel',
  'Jorge',
  'Eduardo',
  'Francisco',
  'Antonio',
  'Sergio',
  'Arturo',
  'Gustavo',
  'Héctor',
  'Rodrigo',
  'Salvador',
  'Ignacio',
  'Mario',
];
const LAST_NAMES = [
  'García',
  'Hernández',
  'López',
  'Martínez',
  'González',
  'Pérez',
  'Sánchez',
  'Ramírez',
  'Torres',
  'Flores',
  'Rivera',
  'Gómez',
  'Díaz',
  'Reyes',
  'Morales',
  'Jiménez',
  'Ruiz',
  'Álvarez',
  'Castro',
  'Vargas',
];
const SERVICES = [
  'Classic cut',
  'Beard trim',
  'Fade',
  'Cut + beard',
  'Kids cut',
];

const EXTRA_COUNT = 41;
const extraVisits: readonly DatedAppointment[] = Array.from(
  { length: EXTRA_COUNT },
  (_, i) => {
    const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]}`;
    const date = dateAt(-30 + i);
    return {
      date,
      dateLabel: dateLabelOf(date),
      row: {
        id: `dummy-${i}`,
        start: '9:00',
        end: '9:45',
        clientName: name,
        service: SERVICES[i % SERVICES.length],
        staffName: 'Marco Vega',
        status: 'confirmed' as const,
      },
    };
  },
);

export const clientsVM: ClientsVM = deriveClientsVM(
  [...realVisits, ...extraVisits],
  CLIENT_CONTACTS,
);

/** The fixture account owner (see ACCOUNT_OWNER_NAME / the shell's
 *  UserMenu — the three must agree until real auth exists). Phone is
 *  invented fixture data, same spirit as CLIENT_CONTACTS. */
export const OWNER: OwnerProfile = {
  name: 'Marco Vega',
  email: 'marco@northfade.mx',
  phone: '+52 33 8765 4321',
  photoUrl: '',
};
