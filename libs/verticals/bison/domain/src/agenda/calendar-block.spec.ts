import { describe, expect, it } from 'vitest';
import { createCalendarBlock, makeCalendarBlockId } from './calendar-block';
import type { CalendarBlockId } from './calendar-block';

const NOW = '2026-08-20T12:00:00.000Z';

const id = (): CalendarBlockId => {
  const made = makeCalendarBlockId('cb-1');
  if (!made.ok) throw new Error('fixture id must be valid');
  return made.value;
};

const create = (
  over: Partial<Parameters<typeof createCalendarBlock>[0]> = {},
) =>
  createCalendarBlock({
    id: id(),
    label: 'Comida',
    allDay: false,
    startMin: 13 * 60,
    endMin: 14 * 60,
    dates: { kind: 'recurring', pattern: 'daily' },
    occurredAt: NOW,
    ...over,
  });

describe('createCalendarBlock', () => {
  it('creates a recurring block with a trimmed label', () => {
    const result = create({ label: '  Comida ' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.label).toBe('Comida');
  });

  it('normalizes an all-day block to the full day span', () => {
    const result = create({ allDay: true, startMin: 600, endMin: 660 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.startMin).toBe(0);
    expect(result.value.endMin).toBe(24 * 60);
  });

  it('accepts a one-day range (start = end)', () => {
    const result = create({
      dates: { kind: 'range', start: '2026-08-25', end: '2026-08-25' },
    });
    expect(result.ok).toBe(true);
  });

  it('collects every problem in one error', () => {
    const result = create({
      label: ' ',
      startMin: 900,
      endMin: 600,
      dates: { kind: 'range', start: '2026-08-25', end: '2026-08-20' },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.tag).toBe('domain/invalid-calendar-block');
    expect(
      (result.error.details as { problems: string[] }).problems,
    ).toHaveLength(3);
  });

  it('rejects repeated or out-of-range weekdays', () => {
    const repeated = create({
      dates: { kind: 'recurring', pattern: [1, 1] },
    });
    expect(repeated.ok).toBe(false);
    const invalid = create({ dates: { kind: 'recurring', pattern: [7] } });
    expect(invalid.ok).toBe(false);
  });
});
