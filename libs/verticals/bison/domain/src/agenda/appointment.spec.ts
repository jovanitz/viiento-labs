import { describe, expect, it } from 'vitest';
import { makeClientId } from '../clients/client';
import type { ClientId } from '../clients/client';
import {
  bookAppointment,
  cancelAppointment,
  makeAppointmentId,
  rescheduleAppointment,
} from './appointment';
import type { Appointment, AppointmentId } from './appointment';

const NOW = '2026-08-20T12:00:00.000Z';

const id = (): AppointmentId => {
  const made = makeAppointmentId('apt-1');
  if (!made.ok) throw new Error('fixture id must be valid');
  return made.value;
};

const clientId = (): ClientId => {
  const made = makeClientId('cli-1');
  if (!made.ok) throw new Error('fixture id must be valid');
  return made.value;
};

const book = (over: Partial<Parameters<typeof bookAppointment>[0]> = {}) =>
  bookAppointment({
    id: id(),
    clientId: clientId(),
    clientName: 'Diana Mendoza',
    service: 'Classic cut',
    date: '2026-08-20',
    startMin: 9 * 60,
    durationMinutes: 45,
    occurredAt: NOW,
    ...over,
  });

const existing = (): Appointment => {
  const made = book();
  if (!made.ok) throw new Error('fixture appointment must be valid');
  return made.value;
};

describe('bookAppointment', () => {
  it('books a confirmed slot with trimmed fields', () => {
    const result = book({ service: '  Classic cut ', note: '  ' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('confirmed');
    expect(result.value.service).toBe('Classic cut');
    expect(result.value.note).toBeUndefined();
    expect(result.value.staffName).toBe('');
  });

  it('collects every slot problem in one error', () => {
    const result = book({
      date: '20-08-2026',
      startMin: -10,
      durationMinutes: 0,
      clientName: ' ',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.tag).toBe('domain/invalid-appointment');
    expect(
      (result.error.details as { problems: string[] }).problems,
    ).toHaveLength(4);
  });

  it('accepts an empty service — the dialog has no service field', () => {
    const result = book({ service: '' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.service).toBe('');
  });

  it('rejects a slot that spills past midnight', () => {
    const result = book({ startMin: 23 * 60, durationMinutes: 120 });
    expect(result.ok).toBe(false);
  });
});

describe('rescheduleAppointment', () => {
  it('moves the slot in place and bumps updatedAt', () => {
    const later = '2026-08-20T13:00:00.000Z';
    const result = rescheduleAppointment(
      existing(),
      { startMin: 11 * 60, durationMinutes: 30 },
      later,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe('apt-1');
    expect(result.value.startMin).toBe(660);
    expect(result.value.updatedAt).toBe(later);
  });

  it('refuses to move a canceled appointment', () => {
    const canceled = cancelAppointment(existing(), NOW);
    if (!canceled.ok) throw new Error('fixture cancel must succeed');
    const result = rescheduleAppointment(
      canceled.value,
      { startMin: 600 },
      NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.tag).toBe('domain/appointment-canceled');
    }
  });

  it('validates the new slot', () => {
    const result = rescheduleAppointment(existing(), { startMin: 2000 }, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.tag).toBe('domain/invalid-appointment');
    }
  });
});

describe('cancelAppointment', () => {
  it('takes the appointment off the books, once', () => {
    const canceled = cancelAppointment(existing(), NOW);
    expect(canceled.ok).toBe(true);
    if (!canceled.ok) return;
    expect(canceled.value.status).toBe('canceled');

    const again = cancelAppointment(canceled.value, NOW);
    expect(again.ok).toBe(false);
    if (!again.ok) {
      expect(again.error.tag).toBe('domain/appointment-already-canceled');
    }
  });
});
