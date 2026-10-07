/**
 * Reading a picked file into the value a `file` block (or the client
 * photo) carries — DOWNSCALING images on the way in.
 *
 * Why here and why at all: a phone photo is 2–5 MB, and every one of them
 * is stored forever and re-downloaded on every view. Nothing on screen or
 * on paper uses more than ~1600px (the document embeds images at 180pt),
 * so the full-resolution original is pure cost: storage, egress, and a
 * slower app. Shrinking at CAPTURE time is the only place it can be done
 * once instead of per read.
 *
 * Non-images (a PDF, a document) pass through untouched — resampling them
 * would destroy them. So does an image the browser cannot decode: the
 * capture always succeeds with the original bytes rather than failing,
 * because losing the user's photo is far worse than storing it big.
 */

/** Longest edge, in pixels, an image is stored at. */
export const MAX_IMAGE_EDGE_PX = 1600;
const JPEG_QUALITY = 0.82;

/** Formats worth re-encoding. A GIF may be animated (a re-encode would
 *  freeze it) and anything else is not ours to reinterpret. */
const DOWNSCALABLE = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type CapturedFile = {
  readonly name: string;
  readonly mime: string;
  readonly size: number;
  readonly dataUrl: string;
};

/** Fit (w × h) inside a square of `max`, preserving aspect ratio. Never
 *  enlarges: a small image keeps its own size. Pure — the only part of
 *  this module with arithmetic worth testing. */
export const fitWithin = (
  width: number,
  height: number,
  max: number,
): { readonly width: number; readonly height: number } => {
  const longest = Math.max(width, height);
  if (longest <= max || longest === 0) return { width, height };
  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

/** Byte length behind a base64 data URL, without decoding it. */
export const dataUrlByteLength = (dataUrl: string): number => {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const padded = base64.endsWith('=') ? 1 : 0;
  const padding = base64.endsWith('==') ? 2 : padded;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
};

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });

/** Is there a canvas to re-encode with at all? Checked BEFORE decoding:
 *  without one there is nothing to gain from reading the image. */
const canvasSupported = (): boolean => {
  try {
    return document.createElement('canvas').getContext('2d') !== null;
  } catch {
    return false;
  }
};

/** Decode, but never wait forever: a browser that fires neither `load`
 *  nor `error` (it happens) must not strand the user's capture. */
const DECODE_TIMEOUT_MS = 8000;

const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(
      () => reject(new Error('Image decode timed out.')),
      DECODE_TIMEOUT_MS,
    );
    image.onload = () => {
      clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Not a decodable image.'));
    };
    image.src = dataUrl;
  });

/** Draw the image at `size` onto a white canvas and re-encode as JPEG.
 *  White because transparency has no meaning on the surfaces these images
 *  end up on (a page, a chip, an avatar) — and JPEG, because a photo
 *  re-encoded as PNG would come out larger than the original. */
const encodeDownscaled = (
  image: HTMLImageElement,
  size: { readonly width: number; readonly height: number },
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No 2d canvas context.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(image, 0, 0, size.width, size.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
};

const downscaled = async (
  file: File,
  original: string,
): Promise<CapturedFile | null> => {
  const image = await loadImage(original);
  const size = fitWithin(
    image.naturalWidth,
    image.naturalHeight,
    MAX_IMAGE_EDGE_PX,
  );
  const dataUrl = encodeDownscaled(image, size);
  const bytes = dataUrlByteLength(dataUrl);
  // A small graphic can come out BIGGER re-encoded; keep the original then.
  if (bytes >= file.size) return null;
  return { name: file.name, mime: 'image/jpeg', size: bytes, dataUrl };
};

/**
 * Read a picked file into its captured value. Images are downscaled to
 * `MAX_IMAGE_EDGE_PX`; everything else — and every failure — keeps the
 * original bytes.
 */
export const captureFile = async (file: File): Promise<CapturedFile> => {
  const original = await readAsDataUrl(file);
  const asIs: CapturedFile = {
    name: file.name,
    mime: file.type,
    size: file.size,
    dataUrl: original,
  };
  if (!DOWNSCALABLE.has(file.type) || !canvasSupported()) return asIs;
  try {
    return (await downscaled(file, original)) ?? asIs;
  } catch {
    // No canvas (server-side render, jsdom), an undecodable image, a
    // tainted context: store what the user gave us.
    return asIs;
  }
};
