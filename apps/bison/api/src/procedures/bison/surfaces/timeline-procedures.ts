import { z } from 'zod';
import { defineApiProcedure } from '../../../rpc/procedure';
import type { ApiProcedure } from '../../../rpc/procedure';
import { bisonUseCasesOf, deniedIfBlocked } from '../context';
import type { BisonProcedureDeps } from '../context';

const listTimeline = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.timeline.list',
    summary: "A client's running record, newest first.",
    action: null,
    input: z.object({ clientId: z.string().min(1) }).strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).timeline.list({
        clientId: input.clientId,
      }),
  });

const logEntry = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.timeline.log',
    summary:
      "Fill a template onto a client's timeline. Values are keyed by block " +
      'id; the domain validates the whole fill (required, choices, unknown ' +
      'blocks) and reports every offender at once.',
    action: null,
    input: z
      .object({
        clientId: z.string().min(1),
        templateId: z.string().min(1),
        values: z.record(z.string().max(20_000)),
      })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).timeline.logEntry({
        clientId: input.clientId,
        templateId: input.templateId,
        values: input.values,
      }),
  });

/** The timeline — the client app's core loop (pick template → fill → log). */
export const createBisonTimelineProcedures = (
  deps: BisonProcedureDeps,
): ReadonlyArray<ApiProcedure> => [listTimeline(deps), logEntry(deps)];
