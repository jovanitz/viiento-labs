import { z } from 'zod';
import { ok } from '@acme/shared';
import type { AppointmentMove } from '@acme/bison-domain';
import { defineApiProcedure } from '../../rpc/procedure';
import type { ApiProcedure } from '../../rpc/procedure';
import { bisonUseCasesOf, definedOnly, deniedIfBlocked } from './context';
import type { BisonProcedureDeps } from './context';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const startMinSchema = z.number().int().min(0).max(1439);
const durationSchema = z.number().int().min(1).max(1440);

const listDay = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.agenda.list',
    summary:
      "One day's appointments by start time, canceled included (they are " +
      'history, not noise).',
    action: null,
    input: z.object({ date: dateSchema }).strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      ok(await bisonUseCasesOf(deps, actor).agenda.listDay(input)),
  });

const book = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.agenda.book',
    summary:
      'Book a slot for a roster client (the name is denormalized from the ' +
      'record). Overlaps are legal — the Reorder modes are UI policy.',
    action: null,
    input: z
      .object({
        clientId: z.string().min(1),
        service: z.string().max(120),
        staffName: z.string().max(120).optional(),
        date: dateSchema,
        startMin: startMinSchema,
        durationMinutes: durationSchema,
        note: z.string().max(2000).optional(),
      })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).agenda.book(
        definedOnly(input) as Parameters<
          ReturnType<typeof bisonUseCasesOf>['agenda']['book']
        >[0],
      ),
  });

const reschedule = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.agenda.reschedule',
    summary:
      'Move a confirmed appointment in place (date/start/duration) — a ' +
      'canceled one is off the books and must be re-booked.',
    action: null,
    input: z
      .object({
        id: z.string().min(1),
        move: z
          .object({
            date: dateSchema.optional(),
            startMin: startMinSchema.optional(),
            durationMinutes: durationSchema.optional(),
          })
          .strict(),
      })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).agenda.reschedule({
        id: input.id,
        move: definedOnly(input.move) as AppointmentMove,
      }),
  });

const cancel = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.agenda.cancel',
    summary: 'Take an appointment off the books (binary status — no limbo).',
    action: null,
    input: z.object({ id: z.string().min(1) }).strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).agenda.cancel(input),
  });

const visits = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.agenda.visits',
    summary:
      'Confirmed-visit facts per client (count + latest) — what the roster ' +
      'shows next to each name.',
    action: null,
    input: z.object({}).strict(),
    handler: async ({ actor }) =>
      deniedIfBlocked(actor) ??
      ok(await bisonUseCasesOf(deps, actor).agenda.visits()),
  });

const blockDatesSchema = z.union([
  z
    .object({
      kind: z.literal('range'),
      start: dateSchema,
      end: dateSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal('recurring'),
      pattern: z.union([
        z.literal('daily'),
        z.array(z.number().int().min(0).max(6)).min(1).max(7),
      ]),
    })
    .strict(),
]);

const listBlocks = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.agenda.blocks.list',
    summary: "The account's blocked time (ranges and weekly recurrences).",
    action: null,
    input: z.object({}).strict(),
    handler: async ({ actor }) =>
      deniedIfBlocked(actor) ??
      ok(await bisonUseCasesOf(deps, actor).calendarBlocks.list()),
  });

const addBlock = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.agenda.blocks.add',
    summary:
      'Block time: a date range (one day or a run) or a weekly recurrence ' +
      '(0 = Sunday). Every scheduling rule treats it as a wall.',
    action: null,
    input: z
      .object({
        label: z.string().min(1).max(120),
        allDay: z.boolean(),
        startMin: startMinSchema,
        endMin: z.number().int().min(1).max(1440),
        dates: blockDatesSchema,
      })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).calendarBlocks.add(input),
  });

const removeBlock = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.agenda.blocks.remove',
    summary:
      'Delete a block — a recurring one goes with its whole series. ' +
      'Idempotent.',
    action: null,
    input: z.object({ id: z.string().min(1) }).strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).calendarBlocks.remove(input),
  });

/** The day grid's surface — same tenancy-is-authorization stance. */
export const createBisonAgendaProcedures = (
  deps: BisonProcedureDeps,
): ReadonlyArray<ApiProcedure> => [
  listDay(deps),
  book(deps),
  reschedule(deps),
  cancel(deps),
  visits(deps),
  listBlocks(deps),
  addBlock(deps),
  removeBlock(deps),
];
