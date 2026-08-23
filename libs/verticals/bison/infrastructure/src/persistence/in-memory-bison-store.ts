import type {
  AppointmentRepository,
  CalendarBlockRepository,
  ClientRepository,
  DocumentFormatRepository,
  EntryRepository,
  TemplateRepository,
  VisitSummary,
} from '@acme/bison-application';
import type {
  Appointment,
  CalendarBlock,
  Client,
  DocumentFormat,
  Entry,
  Template,
} from '@acme/bison-domain';

/**
 * The repositories of one account's bison world, as a bundle — what a
 * composition root wires and what the contract test exercises. The Postgres
 * store hands the same shape out per account (`forAccount`).
 */
export type BisonAccountStore = {
  readonly templates: TemplateRepository;
  readonly clients: ClientRepository;
  readonly entries: EntryRepository;
  readonly appointments: AppointmentRepository;
  readonly calendarBlocks: CalendarBlockRepository;
  readonly formats: DocumentFormatRepository;
};

/** Confirmed visits grouped per client, latest first within each group. */
const toVisitSummaries = (
  appointments: readonly Appointment[],
): ReadonlyArray<VisitSummary> => {
  const byClient = new Map<string, Appointment[]>();
  for (const appointment of appointments) {
    if (appointment.status !== 'confirmed') continue;
    const list = byClient.get(appointment.clientId) ?? [];
    list.push(appointment);
    byClient.set(appointment.clientId, list);
  }
  return [...byClient.values()].map((visits) => {
    const sorted = [...visits].sort(
      (a, b) => b.date.localeCompare(a.date) || b.startMin - a.startMin,
    );
    const latest = sorted[0] as Appointment;
    return {
      clientId: latest.clientId,
      visitCount: sorted.length,
      latestDate: latest.date,
      latestService: latest.service,
    };
  });
};

/** Gallery order: shipped defaults first, then customs by name. */
const templateOrder = (a: Template, b: Template): number => {
  if (a.kind !== b.kind) return a.kind === 'default' ? -1 : 1;
  return a.name.localeCompare(b.name);
};

/**
 * Multi-account twin of `createPostgresBisonStore`: lazily one in-memory
 * world per account, so the API composition root can wire either store
 * behind the same `forAccount` seam.
 */
export const createInMemoryBisonStores = (): {
  readonly forAccount: (accountId: string) => BisonAccountStore;
} => {
  const worlds = new Map<string, BisonAccountStore>();
  return {
    forAccount: (accountId) => {
      const existing = worlds.get(accountId);
      if (existing) return existing;
      const world = createInMemoryBisonStore();
      worlds.set(accountId, world);
      return world;
    },
  };
};

/**
 * In-memory reference adapter — a single account's world (the client app is
 * individual-account scoped). Reference for the contract test, dev seeds and
 * use-case specs; browser-safe.
 */
export const createInMemoryBisonStore = (): BisonAccountStore => {
  const templates = new Map<string, Template>();
  const clients = new Map<string, Client>();
  const entries: Entry[] = [];
  const appointments = new Map<string, Appointment>();
  const calendarBlocks = new Map<string, CalendarBlock>();
  const formats = new Map<string, DocumentFormat>();

  return {
    formats: {
      findById: async (id) => formats.get(id) ?? null,
      list: async () => [...formats.values()],
      save: async (format) => {
        formats.set(format.id, format);
      },
    },
    calendarBlocks: {
      list: async () => [...calendarBlocks.values()],
      save: async (block) => {
        calendarBlocks.set(block.id, block);
      },
      remove: async (id) => {
        calendarBlocks.delete(id);
      },
    },
    appointments: {
      findById: async (id) => appointments.get(id) ?? null,
      listByDay: async (date) =>
        [...appointments.values()]
          .filter((a) => a.date === date)
          .sort((a, b) => a.startMin - b.startMin),
      save: async (appointment) => {
        appointments.set(appointment.id, appointment);
      },
      visitSummaries: async () => toVisitSummaries([...appointments.values()]),
    },
    templates: {
      findById: async (id) => templates.get(id) ?? null,
      list: async () => [...templates.values()].sort(templateOrder),
      save: async (template) => {
        templates.set(template.id, template);
      },
    },
    clients: {
      findById: async (id) => clients.get(id) ?? null,
      list: async () =>
        [...clients.values()].sort((a, b) => a.name.localeCompare(b.name)),
      save: async (client) => {
        clients.set(client.id, client);
      },
    },
    entries: {
      append: async (entry) => {
        entries.push(entry);
      },
      listByClient: async (clientId) =>
        entries
          .filter((entry) => entry.clientId === clientId)
          .sort((a, b) => b.at.localeCompare(a.at)),
    },
  };
};
