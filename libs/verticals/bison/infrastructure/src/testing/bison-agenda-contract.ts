import { describe, expect, it } from 'vitest';
import type {
  Appointment,
  AppointmentId,
  CalendarBlock,
  CalendarBlockId,
  ClientId,
} from '@acme/bison-domain';
import type { BisonAccountStore } from '../persistence/in-memory-bison-store';
import { client } from './bison-store-contract';

/**
 * Contract for the appointments repository — every adapter must satisfy
 * it. Bookings always reference a saved roster client (the FK is real in
 * Postgres). `makeStore` must return a FRESH, EMPTY account world.
 */
const NOW = '2026-08-20T12:00:00.000Z';

export const appointment = (
  clientId: ClientId,
  over: Partial<Appointment> = {},
): Appointment => ({
  id: crypto.randomUUID() as AppointmentId,
  clientId,
  clientName: 'Diana Mendoza',
  service: 'Classic cut',
  staffName: '',
  date: '2026-08-21',
  startMin: 9 * 60,
  durationMinutes: 45,
  status: 'confirmed',
  createdAt: NOW,
  updatedAt: NOW,
  ...over,
});

export const bisonAgendaContract = (
  name: string,
  makeStore: () => BisonAccountStore | Promise<BisonAccountStore>,
): void => {
  describe(`AppointmentRepository contract: ${name}`, () => {
    const withClient = async (store: BisonAccountStore) => {
      const owner = client();
      await store.clients.save(owner);
      return owner.id;
    };

    it('round-trips a booking, note and date included', async () => {
      const store = await makeStore();
      const clientId = await withClient(store);
      const saved = appointment(clientId, { note: 'Primera visita' });
      await store.appointments.save(saved);
      expect(await store.appointments.findById(saved.id)).toEqual(saved);
    });

    it('lists one day by start time, other days excluded', async () => {
      const store = await makeStore();
      const clientId = await withClient(store);
      const late = appointment(clientId, { startMin: 11 * 60 });
      const early = appointment(clientId, { startMin: 9 * 60 });
      const otherDay = appointment(clientId, { date: '2026-08-22' });
      await store.appointments.save(late);
      await store.appointments.save(early);
      await store.appointments.save(otherDay);

      const day = await store.appointments.listByDay('2026-08-21');
      expect(day.map((a) => a.id)).toEqual([early.id, late.id]);
    });

    it('upserts on save — a reschedule replaces the slot', async () => {
      const store = await makeStore();
      const clientId = await withClient(store);
      const saved = appointment(clientId);
      await store.appointments.save(saved);
      await store.appointments.save({ ...saved, startMin: 13 * 60 });
      const found = await store.appointments.findById(saved.id);
      expect(found?.startMin).toBe(780);
    });

    it('round-trips calendar blocks and removes a whole series', async () => {
      const store = await makeStore();
      const range: CalendarBlock = {
        id: crypto.randomUUID() as CalendarBlockId,
        label: 'Vacaciones',
        allDay: true,
        startMin: 0,
        endMin: 1440,
        dates: { kind: 'range', start: '2026-08-24', end: '2026-08-28' },
        createdAt: NOW,
      };
      const weekly: CalendarBlock = {
        id: crypto.randomUUID() as CalendarBlockId,
        label: 'Comida',
        allDay: false,
        startMin: 13 * 60,
        endMin: 14 * 60,
        dates: { kind: 'recurring', pattern: [1, 3, 5] },
        createdAt: NOW,
      };
      await store.calendarBlocks.save(range);
      await store.calendarBlocks.save(weekly);

      const listed = await store.calendarBlocks.list();
      expect(listed).toEqual([range, weekly]);

      await store.calendarBlocks.remove(weekly.id);
      expect(await store.calendarBlocks.list()).toEqual([range]);
    });

    it('summarizes confirmed visits per client, latest first', async () => {
      const store = await makeStore();
      const clientId = await withClient(store);
      await store.appointments.save(
        appointment(clientId, { date: '2026-08-10', service: 'Old cut' }),
      );
      await store.appointments.save(
        appointment(clientId, { date: '2026-08-21', service: 'Beard trim' }),
      );
      await store.appointments.save(
        appointment(clientId, { date: '2026-08-22', status: 'canceled' }),
      );

      const summaries = await store.appointments.visitSummaries();
      expect(summaries).toEqual([
        {
          clientId,
          visitCount: 2,
          latestDate: '2026-08-21',
          latestService: 'Beard trim',
        },
      ]);
    });
  });
};
