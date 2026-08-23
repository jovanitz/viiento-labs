/**
 * A durable key→string cache — the port behind offline read caches
 * (ADR-0007: reads should not block on the network). Deliberately tiny:
 * values are opaque strings (callers JSON-encode), failures may throw and
 * the CALLER decides whether a broken cache is fatal (for an offline
 * fallback it never is — a cache miss just means "no last-known copy").
 */
export type KvCache = {
  readonly get: (key: string) => Promise<string | null>;
  readonly set: (key: string, value: string) => Promise<void>;
};

/** In-memory adapter — tests and non-persistent contexts. */
export const createInMemoryKvCache = (): KvCache => {
  const store = new Map<string, string>();
  return {
    get: async (key) => store.get(key) ?? null,
    set: async (key, value) => {
      store.set(key, value);
    },
  };
};
