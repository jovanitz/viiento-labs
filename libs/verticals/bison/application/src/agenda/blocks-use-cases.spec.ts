import { describe, expect, it } from 'vitest';
import { fixedClock, noopLogger, sequentialIdGenerator } from '@acme/shared';
import type { CalendarBlock } from '@acme/bison-domain';
import type { CalendarBlockRepository } from './ports';
import { makeCalendarBlockUseCases } from './blocks-use-cases';

const inMemoryBlocks = (): CalendarBlockRepository => {
  const store = new Map<string, CalendarBlock>();
  return {
    list: async () => [...store.values()],
    save: async (block) => {
      store.set(block.id, block);
    },
    remove: async (id) => {
      store.delete(id);
    },
  };
};

const useCases = () =>
  makeCalendarBlockUseCases({
    blocks: inMemoryBlocks(),
    clock: fixedClock(new Date('2026-08-20T12:00:00.000Z')),
    ids: sequentialIdGenerator('cb'),
    logger: noopLogger,
  });

describe('Calendar block use cases', () => {
  it('adds a recurring block and lists it back', async () => {
    const blocks = useCases();
    const added = await blocks.add({
      label: '  Comida ',
      allDay: false,
      startMin: 13 * 60,
      endMin: 14 * 60,
      dates: { kind: 'recurring', pattern: [1, 3, 5] },
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.value.label).toBe('Comida');

    const listed = await blocks.list();
    expect(listed).toEqual([added.value]);
  });

  it('propagates domain validation as one error with every problem', async () => {
    const blocks = useCases();
    const added = await blocks.add({
      label: ' ',
      allDay: false,
      startMin: 900,
      endMin: 600,
      dates: { kind: 'range', start: '2026-08-25', end: '2026-08-20' },
    });
    expect(added.ok).toBe(false);
    if (added.ok) return;
    expect(added.error.tag).toBe('domain/invalid-calendar-block');
    expect(
      (added.error.details as { problems: string[] }).problems,
    ).toHaveLength(3);
  });

  it('removes a block idempotently', async () => {
    const blocks = useCases();
    const added = await blocks.add({
      label: 'Vacaciones',
      allDay: true,
      startMin: 0,
      endMin: 1440,
      dates: { kind: 'range', start: '2026-08-24', end: '2026-08-28' },
    });
    if (!added.ok) throw new Error('fixture add must succeed');

    const removed = await blocks.remove({ id: added.value.id });
    expect(removed.ok).toBe(true);
    expect(await blocks.list()).toEqual([]);

    const again = await blocks.remove({ id: added.value.id });
    expect(again.ok).toBe(true);
  });
});
