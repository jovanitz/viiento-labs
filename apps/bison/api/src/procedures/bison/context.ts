import type {
  Clock,
  IdGenerator,
  Logger,
  Result,
  TaggedError,
} from '@acme/shared';
import { err } from '@acme/shared';
import { accessDenied } from '@acme/application';
import {
  makeAgendaUseCases,
  makeCalendarBlockUseCases,
  makeFormatUseCases,
  makeClientUseCases,
  makeFileUseCases,
  makeTemplateUseCases,
  makeTimelineUseCases,
} from '@acme/bison-application';
import type {
  AgendaUseCases,
  CalendarBlockUseCases,
  FormatUseCases,
  ClientUseCases,
  FileUseCases,
  TemplateUseCases,
  TimelineUseCases,
} from '@acme/bison-application';
import type { AccessActor } from '@acme/domain';
import type { BisonRuntime } from '../../wiring/bison';

/**
 * Shared plumbing for the bison client procedures. Use cases are built PER
 * REQUEST from the actor's account world (`forAccount`) — that is the whole
 * tenancy story: no bison repository ever exists unscoped.
 */
export type BisonProcedureDeps = {
  readonly bison: BisonRuntime;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly logger: Logger;
};

export type BisonUseCases = {
  readonly templates: TemplateUseCases;
  readonly clients: ClientUseCases;
  readonly timeline: TimelineUseCases;
  readonly files: FileUseCases;
  readonly agenda: AgendaUseCases;
  readonly calendarBlocks: CalendarBlockUseCases;
  readonly formats: FormatUseCases;
};

export const bisonUseCasesOf = (
  deps: BisonProcedureDeps,
  actor: AccessActor,
): BisonUseCases => {
  const { world, files } = deps.bison.forAccount(actor.membership.accountId);
  const shared = { clock: deps.clock, ids: deps.ids, logger: deps.logger };
  return {
    templates: makeTemplateUseCases({ templates: world.templates, ...shared }),
    clients: makeClientUseCases({ clients: world.clients, ...shared }),
    timeline: makeTimelineUseCases({
      entries: world.entries,
      templates: world.templates,
      clients: world.clients,
      ...shared,
    }),
    files: makeFileUseCases({
      files,
      clients: world.clients,
      ids: deps.ids,
    }),
    agenda: makeAgendaUseCases({
      appointments: world.appointments,
      clients: world.clients,
      ...shared,
    }),
    calendarBlocks: makeCalendarBlockUseCases({
      blocks: world.calendarBlocks,
      ...shared,
    }),
    formats: makeFormatUseCases({ formats: world.formats, ...shared }),
  };
};

/**
 * Soft block (ADR-0014): bison operations aren't permission-gated (any
 * member of the individual account operates its own world), so the policy
 * core never sees them — this guard keeps the "can sign in, cannot operate"
 * promise for blocked actors.
 */
export const deniedIfBlocked = (
  actor: AccessActor,
): Result<never, TaggedError> | null =>
  actor.blocked
    ? err(accessDenied('Account is blocked from operating.'))
    : null;

/** Strip undefined members so zod-optional inputs satisfy the application
 *  layer's exact optional property types. */
export const definedOnly = <T extends object>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, member]) => member !== undefined),
  ) as T;
