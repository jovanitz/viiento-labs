import { type Result, err, ok } from '@acme/shared';
import { accessDenied } from '@acme/application';
import type { ApiClient } from '@acme/application';
import { bisonGatewayError } from '@acme/bison-application';
import type {
  BisonClientGateway,
  BisonGatewayError,
} from '@acme/bison-application';

/**
 * Client-side adapter for `BisonClientGateway`: calls the API's `bison.*`
 * procedures through the `ApiClient` port (which attaches the bearer token
 * via the wired `AuthProvider`) — same shape as `createRpcAccessGateway`.
 * 401/403 collapse into `app/access-denied`; any other failure keeps the
 * transport's message inside `app/bison-gateway-error`.
 */
const callProcedure = async <T>(
  api: ApiClient,
  name: string,
  body: unknown,
): Promise<Result<T, BisonGatewayError>> => {
  const response = await api.request<{ readonly data: T }>({
    operation: name,
    method: 'POST',
    path: `rpc/${name}`,
    body,
  });
  if (!response.ok) {
    if (response.error.status === 401 || response.error.status === 403) {
      return err(accessDenied(`Not authorized for ${name}.`));
    }
    return err(bisonGatewayError(response.error.message));
  }
  return ok(response.value.data);
};

type AttachInput = {
  readonly clientId: string;
  readonly name: string;
  readonly mime: string;
  readonly bytesBase64: string;
};

/**
 * Direct-to-bucket upload: reserve a slot, PUT the raw bytes to the signed
 * URL, return the ready FileRef value. `null` means "couldn't" (dev stub
 * without storage, slot denied, network) — the caller falls back to the
 * base64 attach through the API, so uploads always work somewhere.
 */
const directAttach = async (
  call: <T>(name: string, body?: unknown) => Promise<Result<T, unknown>>,
  fetchFn: typeof fetch,
  input: AttachInput,
): Promise<string | null> => {
  try {
    const bytes = Uint8Array.from(atob(input.bytesBase64), (c) =>
      c.charCodeAt(0),
    );
    const slot = await call<{
      readonly uploadUrl: string;
      readonly value: string;
    }>('bison.files.uploadUrl', {
      clientId: input.clientId,
      name: input.name,
      mime: input.mime,
      size: bytes.byteLength,
    });
    if (!slot.ok) return null;
    const put = await fetchFn(slot.value.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': input.mime },
      body: bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer,
    });
    return put.ok ? slot.value.value : null;
  } catch {
    return null;
  }
};

export const createRpcBisonGateway = (deps: {
  readonly api: ApiClient;
  readonly fetchFn?: typeof fetch;
}): BisonClientGateway => {
  const fetchFn = deps.fetchFn ?? fetch;
  const call = <T>(name: string, body: unknown = {}) =>
    callProcedure<T>(deps.api, name, body);

  return {
    templates: {
      list: () => call('bison.templates.list'),
      get: (input) => call('bison.templates.get', input),
      create: (input) => call('bison.templates.create', input),
      update: (input) => call('bison.templates.update', input),
    },
    clients: {
      list: () => call('bison.clients.list'),
      get: (input) => call('bison.clients.get', input),
      create: (input) => call('bison.clients.create', input),
      updateContact: (input) => call('bison.clients.updateContact', input),
    },
    timeline: {
      list: (input) => call('bison.timeline.list', input),
      log: (input) => call('bison.timeline.log', input),
    },
    files: {
      attach: async (input) => {
        const direct = await directAttach(call, fetchFn, input);
        return direct !== null ? ok(direct) : call('bison.files.attach', input);
      },
      url: (input) => call('bison.files.url', input),
    },
    agenda: {
      list: (input) => call('bison.agenda.list', input),
      book: (input) => call('bison.agenda.book', input),
      reschedule: (input) => call('bison.agenda.reschedule', input),
      cancel: (input) => call('bison.agenda.cancel', input),
      visits: () => call('bison.agenda.visits'),
      blocks: {
        list: () => call('bison.agenda.blocks.list'),
        add: (input) => call('bison.agenda.blocks.add', input),
        remove: (input) => call('bison.agenda.blocks.remove', input),
      },
    },
    formats: {
      list: () => call('bison.formats.list'),
      save: (input) => call('bison.formats.save', input),
    },
  };
};
