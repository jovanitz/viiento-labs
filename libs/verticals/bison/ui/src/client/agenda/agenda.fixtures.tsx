/**
 * Fixture ViewModels for the Agenda screen — one day per state the prototype
 * and stories need: a closed yesterday, a busy today, a sparse tomorrow, a
 * free day, and a day whose agenda fails to load. Data only.
 */
import type { AgendaVM, AppointmentRow } from './agenda.types';

const day = (
  vm: Omit<AgendaVM, 'loading' | 'empty' | 'canSchedule'>,
): AgendaVM => ({
  ...vm,
  loading: false,
  empty: vm.appointments.length === 0 && !vm.error,
  canSchedule: true,
});

const todayRows: readonly AppointmentRow[] = [
  {
    id: 'a1',
    start: '9:00',
    end: '9:45',
    clientName: 'Diego Marín',
    service: 'Classic cut',
    staffName: 'Marco',
    status: 'confirmed',
  },
  {
    id: 'a2',
    start: '10:00',
    end: '10:30',
    clientName: 'Luis Peña',
    service: 'Beard trim',
    staffName: 'Rubén',
    status: 'confirmed',
  },
  {
    id: 'a3',
    start: '10:45',
    end: '11:30',
    clientName: 'Óscar Gil',
    service: 'Fade',
    staffName: 'Marco',
    status: 'canceled',
  },
  {
    id: 'a4',
    start: '11:30',
    end: '12:15',
    clientName: 'Emilio Cruz',
    service: 'Cut + beard',
    staffName: 'Marco',
    status: 'confirmed',
  },
  {
    id: 'a5',
    start: '13:00',
    end: '13:45',
    clientName: 'Andrés Soto',
    service: 'Classic cut',
    staffName: 'Rubén',
    status: 'confirmed',
    note: 'Prefers the #2 guard',
  },
  {
    id: 'a6',
    start: '14:00',
    end: '14:45',
    clientName: 'Javier Luna',
    service: 'Color touch-up',
    staffName: 'Marco',
    status: 'confirmed',
  },
  {
    id: 'a7',
    start: '16:00',
    end: '16:30',
    clientName: 'Iván Ríos',
    service: 'Kids cut',
    staffName: 'Rubén',
    status: 'confirmed',
  },
  {
    id: 'a8',
    start: '17:30',
    end: '18:15',
    clientName: 'Pablo Vidal',
    service: 'Classic cut',
    staffName: 'Marco',
    status: 'canceled',
  },
];

export const todayVM = day({
  dateLabel: 'Mon, Aug 3',
  isToday: true,
  summary: '8 appointments · 2 canceled',
  appointments: todayRows,
});

export const yesterdayVM = day({
  dateLabel: 'Sun, Aug 2',
  isToday: false,
  summary: '4 appointments · 1 canceled',
  appointments: [
    {
      id: 'y1',
      start: '10:00',
      end: '10:45',
      clientName: 'Raúl Ortega',
      service: 'Classic cut',
      staffName: 'Marco',
      status: 'confirmed',
    },
    {
      id: 'y2',
      start: '11:00',
      end: '11:30',
      clientName: 'Beto Salas',
      service: 'Beard trim',
      staffName: 'Marco',
      status: 'confirmed',
    },
    {
      id: 'y3',
      start: '12:00',
      end: '12:45',
      clientName: 'Chuy Navarro',
      service: 'Fade',
      staffName: 'Rubén',
      status: 'canceled',
    },
    {
      id: 'y4',
      start: '13:30',
      end: '14:15',
      clientName: 'Memo Ávila',
      service: 'Cut + beard',
      staffName: 'Rubén',
      status: 'confirmed',
    },
  ],
});

export const tomorrowVM = day({
  dateLabel: 'Tue, Aug 4',
  isToday: false,
  summary: '2 appointments · morning free',
  appointments: [
    {
      id: 't1',
      start: '15:00',
      end: '15:45',
      clientName: 'Andrés Soto',
      service: 'Classic cut',
      staffName: 'Marco',
      status: 'confirmed',
    },
    {
      id: 't2',
      start: '17:00',
      end: '17:30',
      clientName: 'Iván Ríos',
      service: 'Beard trim',
      staffName: 'Rubén',
      status: 'confirmed',
    },
  ],
});

export const freeDayVM = day({
  dateLabel: 'Wed, Aug 5',
  isToday: false,
  appointments: [],
});

export const errorVM = day({
  dateLabel: 'Thu, Aug 6',
  isToday: false,
  appointments: [],
  error:
    'The agenda service didn’t respond. Check your connection and try again.',
});

export const loadingVM: AgendaVM = {
  dateLabel: 'Mon, Aug 3',
  isToday: true,
  appointments: [],
  loading: true,
  empty: false,
  canSchedule: true,
};

/** A staff member without scheduling capability — view-only agenda. */
export const readOnlyVM: AgendaVM = { ...todayVM, canSchedule: false };
