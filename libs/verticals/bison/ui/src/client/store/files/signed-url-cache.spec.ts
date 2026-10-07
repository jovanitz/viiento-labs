import { describe, expect, it } from 'vitest';
import { createSignedUrlCache } from './signed-url-cache';

describe('createSignedUrlCache', () => {
  it('mints once per path and reuses the URL (the CDN caches by URL)', async () => {
    let calls = 0;
    const cached = createSignedUrlCache(async (path) => {
      calls += 1;
      return `${path}?sig=${calls}`;
    });

    expect(await cached('a')).toBe('a?sig=1');
    expect(await cached('a')).toBe('a?sig=1');
    expect(await cached('b')).toBe('b?sig=2');
    expect(calls).toBe(2);
  });

  it('collapses concurrent asks for the same path into one request', async () => {
    let calls = 0;
    const cached = createSignedUrlCache(async (path) => {
      calls += 1;
      await Promise.resolve();
      return `${path}?sig`;
    });

    const [first, second] = await Promise.all([cached('a'), cached('a')]);
    expect(first).toBe(second);
    expect(calls).toBe(1);
  });

  it('re-mints once the cached URL is stale', async () => {
    let calls = 0;
    const cached = createSignedUrlCache(async () => `url-${++calls}`, 0);
    expect(await cached('a')).toBe('url-1');
    expect(await cached('a')).toBe('url-2');
  });

  it('never caches a failure — the next view retries', async () => {
    let calls = 0;
    const cached = createSignedUrlCache(async () => {
      calls += 1;
      return calls === 1 ? null : 'url';
    });
    expect(await cached('a')).toBeNull();
    expect(await cached('a')).toBe('url');
  });
});
