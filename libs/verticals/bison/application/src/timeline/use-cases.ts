import {
  type Clock,
  type IdGenerator,
  type Logger,
  type Result,
  type TaggedError,
  err,
  ok,
} from '@acme/shared';
import {
  fillEntry,
  makeClientId,
  makeEntryId,
  makeTemplateId,
} from '@acme/bison-domain';
import type {
  ClientDomainError,
  EntryDomainError,
  FillValues,
  TemplateDomainError,
} from '@acme/bison-domain';
import { clientNotFound } from '../clients/errors';
import type { ClientRepository } from '../clients/ports';
import { templateNotFound } from '../templates/errors';
import type { TemplateRepository } from '../templates/ports';
import { type EntryDto, toEntryDto } from './dto';
import type { EntryRepository } from './ports';

export type TimelineUseCaseError =
  | EntryDomainError
  | TemplateDomainError
  | ClientDomainError
  | TaggedError<'app/template-not-found'>
  | TaggedError<'app/client-not-found'>;

export type TimelineUseCaseDeps = {
  readonly entries: EntryRepository;
  readonly templates: TemplateRepository;
  readonly clients: ClientRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly logger: Logger;
};

/**
 * Log a filled template onto a client's timeline. The template's schema
 * validates the fill (domain `fillEntry`); what gets appended is the
 * self-contained entry — denormalized fields, never a live schema
 * reference.
 */
export const makeLogEntry =
  (deps: TimelineUseCaseDeps) =>
  async (input: {
    readonly clientId: string;
    readonly templateId: string;
    readonly values: FillValues;
  }): Promise<Result<EntryDto, TimelineUseCaseError>> => {
    const clientId = makeClientId(input.clientId);
    if (!clientId.ok) return err(clientId.error);
    const templateId = makeTemplateId(input.templateId);
    if (!templateId.ok) return err(templateId.error);

    const client = await deps.clients.findById(clientId.value);
    if (!client) {
      return err(clientNotFound(`No client with id ${input.clientId}.`));
    }
    const template = await deps.templates.findById(templateId.value);
    if (!template) {
      return err(templateNotFound(`No template with id ${input.templateId}.`));
    }

    const entryId = makeEntryId(deps.ids.next());
    if (!entryId.ok) return err(entryId.error);

    const filled = fillEntry(template, {
      id: entryId.value,
      clientId: clientId.value,
      values: input.values,
      occurredAt: deps.clock.now().toISOString(),
    });
    if (!filled.ok) return err(filled.error);

    await deps.entries.append(filled.value);
    deps.logger.info('bison.timeline.entry-logged', {
      entryId: filled.value.id,
      clientId: clientId.value,
      templateId: templateId.value,
    });
    return ok(toEntryDto(filled.value));
  };

/** The client's record, newest first. Day grouping is the VM's job. */
export const makeListTimeline =
  (deps: TimelineUseCaseDeps) =>
  async (input: {
    readonly clientId: string;
  }): Promise<Result<ReadonlyArray<EntryDto>, TimelineUseCaseError>> => {
    const clientId = makeClientId(input.clientId);
    if (!clientId.ok) return err(clientId.error);

    const client = await deps.clients.findById(clientId.value);
    if (!client) {
      return err(clientNotFound(`No client with id ${input.clientId}.`));
    }

    const entries = await deps.entries.listByClient(clientId.value);
    return ok(entries.map(toEntryDto));
  };

export type TimelineUseCases = {
  readonly logEntry: ReturnType<typeof makeLogEntry>;
  readonly list: ReturnType<typeof makeListTimeline>;
};

export const makeTimelineUseCases = (
  deps: TimelineUseCaseDeps,
): TimelineUseCases => ({
  logEntry: makeLogEntry(deps),
  list: makeListTimeline(deps),
});
