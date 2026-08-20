import { describe, expect, it } from 'vitest';
import { ok } from '@acme/shared';
import { findFlowCommand } from '@acme/application';
import type { AppointmentDto } from '../../agenda/dto';
import type { BisonClientGateway } from '../../client/gateway';
import { loadAgendaDay, timeOfMinutes } from './agenda';
import { BISON_CLIENT_FLOWS } from './registry';

const appointment = (over: Partial<AppointmentDto> = {}): AppointmentDto => ({
  id: 'apt-1',
  clientId: 'cli-1',
  clientName: 'Diana Mendoza',
  service: 'Classic cut',
  staffName: '',
  date: '2026-08-20',
  startMin: 9 * 60,
  durationMinutes: 45,
  status: 'confirmed',
  createdAt: '2026-08-20T12:00:00.000Z',
  updatedAt: '2026-08-20T12:00:00.000Z',
  ...over,
});

const fakeGateway = (day: readonly AppointmentDto[]) =>
  ({
    agenda: {
      list: async () => ok(day),
      book: async () => ok(appointment()),
      reschedule: async () => ok(appointment({ startMin: 600 })),
      cancel: async () => ok(appointment({ status: 'canceled' })),
      visits: async () => ok([]),
    },
  }) as unknown as BisonClientGateway;

describe('bison agenda flows', () => {
  it('builds the day VM with labels and the canceled tally', async () => {
    const gateway = fakeGateway([
      appointment({ id: 'a', startMin: 540, durationMinutes: 45 }),
      appointment({ id: 'b', startMin: 660, status: 'canceled' }),
    ]);
    const vm = await loadAgendaDay(
      { gateway },
      { date: '2026-08-20', today: '2026-08-20' },
    );
    expect(vm.ok).toBe(true);
    if (!vm.ok) return;
    expect(vm.value.isToday).toBe(true);
    expect(vm.value.dateLabel).toMatch(/Aug 20/);
    expect(vm.value.summary).toBe('2 appointments · 1 canceled');
    expect(vm.value.appointments[0]).toMatchObject({
      start: '9:00',
      end: '9:45',
    });
  });

  it('formats minutes as wall-clock labels', () => {
    expect(timeOfMinutes(9 * 60)).toBe('9:00');
    expect(timeOfMinutes(13 * 60 + 5)).toBe('13:05');
  });

  it('is drivable by name through the registry', async () => {
    const gateway = fakeGateway([]);
    const day = findFlowCommand(BISON_CLIENT_FLOWS, 'bison.agenda.day');
    const cancel = findFlowCommand(BISON_CLIENT_FLOWS, 'bison.agenda.cancel');
    if (!day || !cancel) throw new Error('registry entries must exist');

    const loaded = await day.run(
      { gateway },
      day.input.parse({ date: '2026-08-20', today: '2026-08-21' }),
    );
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect((loaded.value as { isToday: boolean }).isToday).toBe(false);
    }

    const canceled = await cancel.run(
      { gateway },
      cancel.input.parse({ id: 'apt-1' }),
    );
    expect(canceled.ok).toBe(true);

    expect(() => day.input.parse({ date: '20/08/2026' })).toThrow();
  });
});
