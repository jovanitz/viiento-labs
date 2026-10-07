/**
 * Signed URLs, remembered per path.
 *
 * A signed URL is a fresh string every time it is minted, and the CDN in
 * front of object storage caches by URL — so asking for a new one on
 * every render meant every thumbnail, avatar and download re-fetched the
 * bytes from origin. Reusing the same URL while it is still valid turns
 * repeat views into cache hits (bandwidth is the scarce resource here),
 * and collapsing concurrent asks for the same path means a list of ten
 * photos makes one request per photo, not one per rendered component.
 *
 * The cache TTL is deliberately SHORTER than the URL's own expiry
 * (application's DEFAULT_URL_TTL_SECONDS): a handed-out URL must never be
 * one that has already expired in the user's hands.
 */
export type SignedUrlResolver = (path: string) => Promise<string | null>;

/** Kept well under the signed URL's own lifetime. */
const DEFAULT_CACHE_MS = 45 * 60 * 1000;

export const createSignedUrlCache = (
  resolve: SignedUrlResolver,
  ttlMs: number = DEFAULT_CACHE_MS,
): SignedUrlResolver => {
  const fresh = new Map<
    string,
    { readonly url: string; readonly until: number }
  >();
  const inFlight = new Map<string, Promise<string | null>>();

  return async (path) => {
    const hit = fresh.get(path);
    if (hit && hit.until > Date.now()) return hit.url;

    const pending = inFlight.get(path);
    if (pending) return pending;

    const request = resolve(path)
      .then((url) => {
        // A failure is NOT cached: the next view should try again.
        if (url) fresh.set(path, { url, until: Date.now() + ttlMs });
        return url;
      })
      .finally(() => inFlight.delete(path));

    inFlight.set(path, request);
    return request;
  };
};
