import { type Result, err, ok } from '@acme/shared';
import type {
  ClientContactChanges,
  FillValues,
  TemplateColor,
  TemplateIcon,
} from '@acme/bison-domain';
import type { VisitSummaryDto } from '../../agenda/dto';
import type { ClientDto } from '../../clients/dto';
import type { TemplateDto } from '../../templates/dto';
import type { EntryDto } from '../../timeline/dto';
import type {
  BisonClientGateway,
  BisonGatewayError,
} from '../../client/gateway';

/**
 * The Clients controller: HEADLESS orchestration for the client app's
 * roster + client-detail feature. Composes the `bison.*` gateway, builds
 * ViewModels the UI renders verbatim (labels preformatted here, not in
 * components), and exposes commands as plain async functions returning
 * `Result`. No React, no browser — a React store and a future MCP server
 * drive the SAME functions (see registry.ts).
 */
export type BisonClientFlowDeps = {
  readonly gateway: BisonClientGateway;
};

export type ClientRowVM = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly photoUrl?: string | undefined;
  readonly phone: string;
  readonly channels: ClientDto['channels'];
  /** Appointments aren't modeled yet, so visit facts render their empty
   *  fallbacks (0 / '') — honest placeholders, not invented history. */
  readonly visitCount: number;
  readonly latestVisitLabel: string;
};

export type ClientsVM = {
  readonly clients: ReadonlyArray<ClientRowVM>;
  readonly summary?: string | undefined;
  readonly empty: boolean;
};

export type TimelineEntryVM = {
  readonly id: string;
  readonly templateId: string;
  readonly templateName: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  /** ISO instant — the UI turns it into a Date at the edge. */
  readonly at: string;
  /** Preformatted — e.g. "9:30 AM". */
  readonly timeLabel: string;
  readonly summary: string;
  /** blockId rides along so consumers can match values back to the schema
   *  (positional matching breaks — the backend skips empty optionals). */
  readonly fields: ReadonlyArray<{
    readonly blockId: string;
    readonly label: string;
    readonly value: string;
  }>;
};

export type TimelineDayVM = {
  /** Preformatted — e.g. "Monday, August 3". */
  readonly dateLabel: string;
  /** Newest first. */
  readonly entries: ReadonlyArray<TimelineEntryVM>;
};

export type ClientDetailVM = {
  readonly client: ClientRowVM;
  /** Newest day first. */
  readonly days: ReadonlyArray<TimelineDayVM>;
  /** The template library, for the add-entry picker. */
  readonly templates: ReadonlyArray<TemplateDto>;
  readonly timelineEmpty: boolean;
};

/** e.g. "Mon, Aug 3" — noon-anchored so the label can't shear a day. */
const shortDateLabel = (date: string): string =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

/** "Mon, Aug 3 · Classic cut" — bookings carry no service since 2026-08-11,
 *  so the label degrades to the date alone, never a dangling separator. */
const visitLabel = (visit: VisitSummaryDto | undefined): string => {
  if (!visit) return '';
  const date = shortDateLabel(visit.latestDate);
  return visit.latestService ? `${date} · ${visit.latestService}` : date;
};

const toRowVM = (client: ClientDto, visit?: VisitSummaryDto): ClientRowVM => ({
  id: client.id,
  name: client.name,
  initials: client.initials,
  photoUrl: client.photoUrl,
  phone: client.phone,
  channels: client.channels,
  visitCount: visit?.visitCount ?? 0,
  latestVisitLabel: visitLabel(visit),
});

const timeLabel = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

const dayLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

const toEntryVM = (entry: EntryDto): TimelineEntryVM => ({
  id: entry.id,
  templateId: entry.templateId,
  templateName: entry.templateName,
  icon: entry.icon,
  color: entry.color,
  at: entry.at,
  timeLabel: timeLabel(entry.at),
  summary: entry.summary,
  fields: entry.fields,
});

/** Group newest-first entries into labeled days (order preserved). */
const toDays = (
  entries: ReadonlyArray<EntryDto>,
): ReadonlyArray<TimelineDayVM> => {
  const days: { key: string; day: TimelineDayVM }[] = [];
  for (const entry of entries) {
    const key = new Date(entry.at).toDateString();
    const last = days[days.length - 1];
    const vm = toEntryVM(entry);
    if (last && last.key === key) {
      last.day = { ...last.day, entries: [...last.day.entries, vm] };
    } else {
      days.push({ key, day: { dateLabel: dayLabel(entry.at), entries: [vm] } });
    }
  }
  return days.map(({ day }) => day);
};

/** Query: the roster with real visit facts (count + latest, confirmed
 *  appointments only) and its one-line summary. */
export const loadClients = async (
  deps: BisonClientFlowDeps,
): Promise<Result<ClientsVM, BisonGatewayError>> => {
  const [listed, visits] = await Promise.all([
    deps.gateway.clients.list(),
    deps.gateway.agenda.visits(),
  ]);
  if (!listed.ok) return err(listed.error);
  if (!visits.ok) return err(visits.error);
  const byClient = new Map(visits.value.map((v) => [v.clientId, v]));
  const clients = listed.value.map((client) =>
    toRowVM(client, byClient.get(client.id)),
  );
  const plural = clients.length === 1 ? '' : 's';
  return ok({
    clients,
    summary:
      clients.length > 0 ? `${clients.length} client${plural}` : undefined,
    empty: clients.length === 0,
  });
};

/** Query: one client's card + their timeline + the template library. */
export const loadClientDetail = async (
  deps: BisonClientFlowDeps,
  input: { readonly clientId: string },
): Promise<Result<ClientDetailVM, BisonGatewayError>> => {
  const [client, timeline, templates] = await Promise.all([
    deps.gateway.clients.get({ id: input.clientId }),
    deps.gateway.timeline.list({ clientId: input.clientId }),
    deps.gateway.templates.list(),
  ]);
  if (!client.ok) return err(client.error);
  if (!timeline.ok) return err(timeline.error);
  if (!templates.ok) return err(templates.error);
  return ok({
    client: toRowVM(client.value),
    days: toDays(timeline.value),
    templates: templates.value,
    timelineEmpty: timeline.value.length === 0,
  });
};

/** Command: add a client to the roster. */
export const createClient = (
  deps: BisonClientFlowDeps,
  input: { readonly name: string; readonly phone?: string },
): Promise<Result<ClientRowVM, BisonGatewayError>> =>
  deps.gateway.clients
    .create(input)
    .then((result) => (result.ok ? ok(toRowVM(result.value)) : result));

/** Command: update a client's contact card (name and/or phone). */
export const updateClientContact = (
  deps: BisonClientFlowDeps,
  input: { readonly id: string; readonly changes: ClientContactChanges },
): Promise<Result<ClientRowVM, BisonGatewayError>> =>
  deps.gateway.clients
    .updateContact(input)
    .then((result) => (result.ok ? ok(toRowVM(result.value)) : result));

/** Command: fill a template onto the client's timeline (one shot — the
 *  record is append-only; corrections arrive as new entries). */
export const logTimelineEntry = (
  deps: BisonClientFlowDeps,
  input: {
    readonly clientId: string;
    readonly templateId: string;
    readonly values: FillValues;
  },
): Promise<Result<TimelineEntryVM, BisonGatewayError>> =>
  deps.gateway.timeline
    .log(input)
    .then((result) => (result.ok ? ok(toEntryVM(result.value)) : result));
