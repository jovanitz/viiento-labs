import { describe, expect, it } from 'vitest';
import { fixedClock, noopLogger, sequentialIdGenerator } from '@acme/shared';
import type { Appointment, Client } from '@acme/bison-domain';
import { makeClientUseCases } from '../clients/use-cases';
import type { ClientRepository } from '../clients/ports';
import type { AppointmentRepository } from './ports';
import { makeAgendaUseCases } from './use-cases';

const inMemoryClients = (): ClientRepository => {
  const store = new Map<string, Client>();
  return {
    findById: async (id) => store.get(id) ?? null,
    list: async () => [...store.values()],
    save: async (client) => {
      store.set(client.id, client);
    },
  };
};

const inMemoryAppointments = (): AppointmentRepository => {
  const store = new Map<string, Appointment>();
  return {
    findById: async (id) => store.get(id) ?? null,
    listByDay: async (date) =>
      [...store.values()]
        .filter((a) => a.date === date)
        .sort((a, b) => a.startMin - b.startMin),
    save: async (appointment) => {
      store.set(appointment.id, appointment);
    },
    visitSummaries: async () => [],
  };
};

const harness = async () => {
  const clients = inMemoryClients();
  const shared = {
    clock: fixedClock(new Date('2026-08-20T12:00:00.000Z')),
    ids: sequentialIdGenerator('id'),
    logger: noopLogger,
  };
  const client = await makeClientUseCases({ clients, ...shared }).create({
    name: 'Diana Mendoza',
  });
  if (!client.ok) throw new Error('fixture client must succeed');
  const agenda = makeAgendaUseCases({
    appointments: inMemoryAppointments(),
    clients,
    ...shared,
  });
  return { agenda, clientId: client.value.id };
};

describe('Agenda use cases', () => {
  it('books with the roster name denormalized, and lists the day in order', async () => {
    const { agenda, clientId } = await harness();
    const late = await agenda.book({
      clientId,
      service: 'Beard trim',
      date: '2026-08-21',
      startMin: 11 * 60,
      durationMinutes: 30,
    });
    const early = await agenda.book({
      clientId,
      service: 'Classic cut',
      date: '2026-08-21',
      startMin: 9 * 60,
      durationMinutes: 45,
    });
    expect(late.ok && early.ok).toBe(true);
    if (!late.ok || !early.ok) return;
    expect(early.value.clientName).toBe('Diana Mendoza');

    const day = await agenda.listDay({ date: '2026-08-21' });
    expect(day.map((a) => a.service)).toEqual(['Classic cut', 'Beard trim']);
  });

  it('refuses to book for a client outside this world', async () => {
    const { agenda } = await harness();
    const result = await agenda.book({
      clientId: 'cli-ajena',
      service: 'Classic cut',
      date: '2026-08-21',
      startMin: 540,
      durationMinutes: 30,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.tag).toBe('app/client-not-found');
  });

  it('reschedules and cancels through the domain rules', async () => {
    const { agenda, clientId } = await harness();
    const booked = await agenda.book({
      clientId,
      service: 'Classic cut',
      date: '2026-08-21',
      startMin: 540,
      durationMinutes: 45,
    });
    if (!booked.ok) throw new Error('fixture booking must succeed');

    const moved = await agenda.reschedule({
      id: booked.value.id,
      move: { startMin: 600 },
    });
    expect(moved.ok).toBe(true);
    if (moved.ok) expect(moved.value.startMin).toBe(600);

    const canceled = await agenda.cancel({ id: booked.value.id });
    expect(canceled.ok).toBe(true);

    const movedAgain = await agenda.reschedule({
      id: booked.value.id,
      move: { startMin: 660 },
    });
    expect(movedAgain.ok).toBe(false);
    if (!movedAgain.ok) {
      expect(movedAgain.error.tag).toBe('domain/appointment-canceled');
    }

    const missing = await agenda.cancel({ id: 'nope' });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.tag).toBe('app/appointment-not-found');
    }
  });
});
