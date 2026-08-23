import { type Result, ok } from '@acme/shared';
import type { KvCache } from '@acme/application';
import type {
  BisonClientGateway,
  BisonGatewayError,
} from '@acme/bison-application';

/**
 * Offline READ fallback (ADR-0007, first half): every successful read is
 * mirrored into a durable cache, and when the transport fails
 * (`app/bison-gateway-error` — network down, API unreachable) the last
 * known copy answers instead. The app opens and shows yesterday's world
 * without a connection.
 *
 * Deliberate limits, stated out loud:
 * - Server VERDICTS pass through untouched: 4xx domain errors and
 *   access-denied mean we reached the API — caching must never mask them.
 * - Mutations are NOT queued yet (the outbox half): creation ids are
 *   server-assigned today, and an offline queue needs client-generated
 *   ids + idempotent upserts first. Writes offline fail with the normal
 *   transport error.
 * - `files.url` is never cached: signed URLs expire by design.
 * - A broken cache degrades to "no fallback", never to a broken app.
 */
const shouldFallback = (error: BisonGatewayError): boolean =>
  error.tag === 'app/bison-gateway-error';

type Envelope = { readonly at: string; readonly data: unknown };

const cachedRead =
  (cache: KvCache, scope: string) =>
  <Input, Output>(
    read: (input: Input) => Promise<Result<Output, BisonGatewayError>>,
    name: string,
  ) =>
  async (input: Input): Promise<Result<Output, BisonGatewayError>> => {
    const key = `${scope}:${name}:${JSON.stringify(input ?? null)}`;
    const result = await read(input);
    if (result.ok) {
      try {
        const envelope: Envelope = {
          at: new Date().toISOString(),
          data: result.value,
        };
        await cache.set(key, JSON.stringify(envelope));
      } catch {
        // A cache that cannot write is just a cache we don't have.
      }
      return result;
    }
    if (!shouldFallback(result.error)) return result;
    try {
      const hit = await cache.get(key);
      if (hit === null) return result;
      const envelope = JSON.parse(hit) as Envelope;
      return ok(envelope.data as Output);
    } catch {
      return result;
    }
  };

export const withOfflineCache = (
  gateway: BisonClientGateway,
  cache: KvCache,
  scope = 'bison-cache',
): BisonClientGateway => {
  const wrap = cachedRead(cache, scope);
  const wrapVoid = <Output>(
    read: () => Promise<Result<Output, BisonGatewayError>>,
    name: string,
  ): (() => Promise<Result<Output, BisonGatewayError>>) => {
    const inner = wrap<null, Output>(() => read(), name);
    return () => inner(null);
  };
  return {
    ...gateway,
    templates: {
      ...gateway.templates,
      list: wrapVoid(() => gateway.templates.list(), 'templates.list'),
      get: wrap(gateway.templates.get, 'templates.get'),
    },
    clients: {
      ...gateway.clients,
      list: wrapVoid(() => gateway.clients.list(), 'clients.list'),
      get: wrap(gateway.clients.get, 'clients.get'),
    },
    timeline: {
      ...gateway.timeline,
      list: wrap(gateway.timeline.list, 'timeline.list'),
    },
    agenda: {
      ...gateway.agenda,
      list: wrap(gateway.agenda.list, 'agenda.list'),
      visits: wrapVoid(() => gateway.agenda.visits(), 'agenda.visits'),
      blocks: {
        ...gateway.agenda.blocks,
        list: wrapVoid(
          () => gateway.agenda.blocks.list(),
          'agenda.blocks.list',
        ),
      },
    },
    formats: {
      ...gateway.formats,
      list: wrapVoid(() => gateway.formats.list(), 'formats.list'),
    },
    identity: {
      ...gateway.identity,
      get: wrapVoid(() => gateway.identity.get(), 'identity.get'),
    },
  };
};
