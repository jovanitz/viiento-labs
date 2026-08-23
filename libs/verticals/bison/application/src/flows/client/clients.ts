import { type Result, err, ok } from '@acme/shared';
import type { ClientContactChanges, FillValues } from '@acme/bison-domain';
import type { BisonGatewayError } from '../../client/gateway';
import type { BisonClientFlowDeps } from './deps';
import { storeClientPhoto, storeFillFiles } from './files/fill-files';
import { toDays, toEntryVM, toRowVM } from './clients.vm';
import type {
  ClientDetailVM,
  ClientRowVM,
  ClientsVM,
  TimelineEntryVM,
} from './clients.vm';

export * from './clients.vm';

/**
 * The Clients controller: HEADLESS orchestration for the client app's
 * roster + client-detail feature. Composes the `bison.*` gateway, builds
 * ViewModels the UI renders verbatim (labels preformatted here, not in
 * components), and exposes commands as plain async functions returning
 * `Result`. No React, no browser — a React store and a future MCP server
 * drive the SAME functions (see registry.ts).
 */
export type { BisonClientFlowDeps } from './deps';

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

/** Command: add a client to the roster. A picked photo (raw data URL)
 *  uploads AFTER the row exists — its storage path lives under the new
 *  client's own prefix — so a failed upload leaves a photo-less client
 *  and a visible error, never a phantom row. */
export const createClient = async (
  deps: BisonClientFlowDeps,
  input: {
    readonly name: string;
    readonly phone?: string;
    readonly photoDataUrl?: string;
  },
): Promise<Result<ClientRowVM, BisonGatewayError>> => {
  const created = await deps.gateway.clients.create({
    name: input.name,
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
  });
  if (!created.ok) return created;
  if (input.photoDataUrl === undefined) return ok(toRowVM(created.value));
  return setClientPhoto(deps, created.value.id, input.photoDataUrl);
};

const setClientPhoto = async (
  deps: BisonClientFlowDeps,
  clientId: string,
  photoDataUrl: string,
): Promise<Result<ClientRowVM, BisonGatewayError>> => {
  const stored = await storeClientPhoto(deps, clientId, photoDataUrl);
  if (!stored.ok) return err(stored.error);
  const updated = await deps.gateway.clients.updateContact({
    id: clientId,
    changes: { photoPath: stored.value },
  });
  return updated.ok ? ok(toRowVM(updated.value)) : updated;
};

/** Command: update a client's contact card. A newly picked photo rides in
 *  as a raw data URL and is uploaded first (same staging as fill files);
 *  the row then persists only the storage path. */
export const updateClientContact = async (
  deps: BisonClientFlowDeps,
  input: {
    readonly id: string;
    readonly changes: ClientContactChanges & {
      readonly photoDataUrl?: string;
    };
  },
): Promise<Result<ClientRowVM, BisonGatewayError>> => {
  const { photoDataUrl, ...contact } = input.changes;
  const changes: ClientContactChanges = { ...contact };
  if (photoDataUrl !== undefined) {
    const stored = await storeClientPhoto(deps, input.id, photoDataUrl);
    if (!stored.ok) return err(stored.error);
    return deps.gateway.clients
      .updateContact({
        id: input.id,
        changes: { ...changes, photoPath: stored.value },
      })
      .then((result) => (result.ok ? ok(toRowVM(result.value)) : result));
  }
  return deps.gateway.clients
    .updateContact({ id: input.id, changes })
    .then((result) => (result.ok ? ok(toRowVM(result.value)) : result));
};

/** Command: fill a template onto the client's timeline (one shot — the
 *  record is append-only; corrections arrive as new entries). Captured
 *  files still carrying their bytes are uploaded first and logged as
 *  FileRef values (see fill-files.ts). */
export const logTimelineEntry = async (
  deps: BisonClientFlowDeps,
  input: {
    readonly clientId: string;
    readonly templateId: string;
    readonly values: FillValues;
  },
): Promise<Result<TimelineEntryVM, BisonGatewayError>> => {
  const values = await storeFillFiles(deps, input.clientId, input.values);
  if (!values.ok) return err(values.error);
  const logged = await deps.gateway.timeline.log({
    ...input,
    values: values.value,
  });
  return logged.ok ? ok(toEntryVM(logged.value)) : logged;
};
