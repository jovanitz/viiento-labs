import { describe, expect, it } from 'vitest';
import { createInMemoryFileStorage } from './in-memory-file-storage';
import { withPathPrefix } from './path-prefixed-file-storage';

describe('withPathPrefix', () => {
  it('scopes every operation under the prefix', async () => {
    const base = createInMemoryFileStorage();
    const scoped = withPathPrefix(base, 'accounts/a1');

    await scoped.put({
      path: 'clients/c1/f1',
      bytes: new Uint8Array([1]),
      mime: 'image/png',
    });
    expect(base.objects.has('accounts/a1/clients/c1/f1')).toBe(true);

    const signed = await scoped.getSignedUrl({
      path: 'clients/c1/f1',
      expiresInSeconds: 60,
    });
    expect(signed.ok).toBe(true);

    const removed = await scoped.remove('clients/c1/f1');
    expect(removed.ok).toBe(true);
    expect(base.objects.size).toBe(0);
  });

  it("keeps tenants apart: one prefix cannot sign another's path", async () => {
    const base = createInMemoryFileStorage();
    const one = withPathPrefix(base, 'accounts/a1');
    const other = withPathPrefix(base, 'accounts/a2');

    await one.put({
      path: 'clients/c1/f1',
      bytes: new Uint8Array([1]),
      mime: 'image/png',
    });
    const signed = await other.getSignedUrl({
      path: 'clients/c1/f1',
      expiresInSeconds: 60,
    });
    expect(signed.ok).toBe(false);
  });
});
