import { describe, expect, it } from 'vitest';
import {
  MAX_IMAGE_EDGE_PX,
  captureFile,
  dataUrlByteLength,
  fitWithin,
} from './capture-file';

describe('fitWithin', () => {
  it('never enlarges an image that already fits', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(0, 0, 1600)).toEqual({ width: 0, height: 0 });
  });

  it('scales the longest edge down, preserving aspect ratio', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('keeps a sliver at least one pixel tall', () => {
    expect(fitWithin(8000, 2, MAX_IMAGE_EDGE_PX).height).toBe(1);
  });
});

describe('dataUrlByteLength', () => {
  it('counts the bytes behind the base64, padding excluded', () => {
    // 'AQIDBA==' is 4 bytes (1,2,3,4); 'AQID' is 3.
    expect(dataUrlByteLength('data:image/png;base64,AQIDBA==')).toBe(4);
    expect(dataUrlByteLength('data:image/png;base64,AQID')).toBe(3);
    expect(dataUrlByteLength('data:image/png;base64,')).toBe(0);
  });
});

/** A File whose bytes never decode as an image — the browser-less path. */
const fileOf = (name: string, type: string, bytes: number): File =>
  new File([new Uint8Array(bytes)], name, { type });

describe('captureFile', () => {
  it('passes a document through untouched', async () => {
    const captured = await captureFile(
      fileOf('estudio.pdf', 'application/pdf', 8),
    );
    expect(captured.mime).toBe('application/pdf');
    expect(captured.size).toBe(8);
    expect(captured.dataUrl.startsWith('data:application/pdf')).toBe(true);
  });

  it('keeps the original bytes when the image cannot be downscaled', async () => {
    // jsdom decodes nothing and has no canvas: capture must still succeed.
    const captured = await captureFile(fileOf('foto.png', 'image/png', 16));
    expect(captured.name).toBe('foto.png');
    expect(captured.size).toBe(16);
    expect(captured.dataUrl.length).toBeGreaterThan(0);
  });
});
