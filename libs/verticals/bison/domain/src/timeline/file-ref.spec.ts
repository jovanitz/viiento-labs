import { describe, expect, it } from 'vitest';
import {
  decodeFileRef,
  encodeFileRef,
  fileDisplayName,
  isImageRef,
} from './file-ref';
import type { FileRef } from './file-ref';

const ref: FileRef = {
  name: 'radiografia.png',
  mime: 'image/png',
  size: 204800,
  storagePath: 'clients/cli-1/file-1',
};

describe('FileRef codec', () => {
  it('round-trips through the ordinary string value', () => {
    expect(decodeFileRef(encodeFileRef(ref))).toEqual(ref);
  });

  it('fails soft on a plain filename', () => {
    expect(decodeFileRef('radiografia.png')).toBeUndefined();
  });

  it('fails soft on JSON that is not a file ref', () => {
    expect(decodeFileRef('{"kind":"other"}')).toBeUndefined();
    expect(decodeFileRef('{not json')).toBeUndefined();
  });

  it('rejects the legacy dataUrl shape (no storagePath)', () => {
    const legacy = JSON.stringify({
      kind: 'file',
      name: 'x.png',
      mime: 'image/png',
      size: 1,
      dataUrl: 'data:image/png;base64,AAAA',
    });
    expect(decodeFileRef(legacy)).toBeUndefined();
  });
});

describe('file presentation helpers', () => {
  it('detects images by mime', () => {
    expect(isImageRef(ref)).toBe(true);
    expect(isImageRef({ ...ref, mime: 'application/pdf' })).toBe(false);
  });

  it('displays the decoded name, or the raw value as fallback', () => {
    expect(fileDisplayName(encodeFileRef(ref))).toBe('radiografia.png');
    expect(fileDisplayName('consentimiento.pdf')).toBe('consentimiento.pdf');
  });
});
