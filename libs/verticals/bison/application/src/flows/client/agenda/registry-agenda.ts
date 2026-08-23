import { z } from 'zod';
import type { FlowCommand } from '@acme/application';
import type { BisonClientFlowDeps } from './clients';
import {
  addCalendarBlock,
  bookAppointment,
  cancelAppointment,
  loadAgendaDay,
  loadCalendarBlocks,
  removeCalendarBlock,
  rescheduleAppointment,
} from './agenda';

/** The Agenda's flow entries — assembled into BISON_CLIENT_FLOWS. */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const daySchema = z.object({ date: dateSchema, today: dateSchema });
const bookSchema = z.object({
  clientId: z.string().min(1),
  service: z.string().max(120),
  staffName: z.string().max(120).optional(),
  date: dateSchema,
  startMin: z.number().int().min(0).max(1439),
  durationMinutes: z.number().int().min(1).max(1440),
  note: z.string().max(2000).optional(),
});
const moveSchema = z.object({
  id: z.string().min(1),
  move: z
    .object({
      date: dateSchema.optional(),
      startMin: z.number().int().min(0).max(1439).optional(),
      durationMinutes: z.number().int().min(1).max(1440).optional(),
    })
    .strict(),
});
const idSchema = z.object({ id: z.string().min(1) });

export const AGENDA_FLOWS: ReadonlyArray<FlowCommand<BisonClientFlowDeps>> = [
  {
    name: 'bison.agenda.day',
    kind: 'query',
    description:
      "One day's grid: appointments by start time with labels and the " +
      'summary line preformatted.',
    input: daySchema,
    run: (deps, input) =>
      loadAgendaDay(deps, input as { date: string; today: string }),
  },
  {
    name: 'bison.agenda.book',
    kind: 'command',
    description:
      'Book a slot for a roster client. Overlaps are legal — the Reorder ' +
      'modes are UI policy.',
    input: bookSchema,
    run: (deps, input) =>
      bookAppointment(deps, input as Parameters<typeof bookAppointment>[1]),
  },
  {
    name: 'bison.agenda.reschedule',
    kind: 'command',
    description: 'Move a confirmed appointment in place (date/start/duration).',
    input: moveSchema,
    run: (deps, input) =>
      rescheduleAppointment(
        deps,
        input as Parameters<typeof rescheduleAppointment>[1],
      ),
  },
  {
    name: 'bison.agenda.cancel',
    kind: 'command',
    description: 'Take an appointment off the books (binary status).',
    input: idSchema,
    run: (deps, input) => cancelAppointment(deps, input as { id: string }),
  },
  {
    name: 'bison.agenda.blocks.board',
    kind: 'query',
    description:
      "The account's blocked time (date ranges and weekly recurrences).",
    input: z.object({}),
    run: (deps) => loadCalendarBlocks(deps),
  },
  {
    name: 'bison.agenda.blocks.add',
    kind: 'command',
    description:
      'Block time: a date range or a weekly recurrence (0 = Sunday) — a ' +
      'wall every scheduling rule respects.',
    input: z.object({
      label: z.string().min(1).max(120),
      allDay: z.boolean(),
      startMin: z.number().int().min(0).max(1439),
      endMin: z.number().int().min(1).max(1440),
      dates: z.union([
        z.object({ kind: z.literal('range'), start: dateSchema, end: dateSchema }),
        z.object({
          kind: z.literal('recurring'),
          pattern: z.union([
            z.literal('daily'),
            z.array(z.number().int().min(0).max(6)).min(1).max(7),
          ]),
        }),
      ]),
    }),
    run: (deps, input) =>
      addCalendarBlock(deps, input as Parameters<typeof addCalendarBlock>[1]),
  },
  {
    name: 'bison.agenda.blocks.remove',
    kind: 'command',
    description: 'Delete a block (a recurring one with its whole series).',
    input: idSchema,
    run: (deps, input) =>
      removeCalendarBlock(deps, input as { id: string }),
  },
];
