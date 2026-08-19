/**
 * The value a `file` block captures, encoded INSIDE the ordinary string
 * value every other kind uses — so stores, summaries, entries and the
 * printed page keep their one shape (FillValues stays
 * Record<string, string>) and only the presenters decode.
 *
 * A legacy/plain value (just a filename, like the generated samples)
 * simply fails to decode and is shown as a name-only chip — never an
 * error.
 */

export type FileValue = {
  readonly name: string;
  readonly mime: string;
  /** Bytes. */
  readonly size: number;
  /** The content itself, so the prototype needs no storage and the
   *  printed page can embed images. */
  readonly dataUrl: string;
};

export const encodeFileValue = (file: FileValue): string =>
  JSON.stringify({ kind: 'file', ...file });

export const decodeFileValue = (value: string): FileValue | undefined => {
  if (!value.startsWith('{')) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as { kind?: unknown }).kind === 'file' &&
      typeof (parsed as { name?: unknown }).name === 'string' &&
      typeof (parsed as { mime?: unknown }).mime === 'string' &&
      typeof (parsed as { size?: unknown }).size === 'number' &&
      typeof (parsed as { dataUrl?: unknown }).dataUrl === 'string'
    ) {
      const { name, mime, size, dataUrl } = parsed as FileValue;
      return { name, mime, size, dataUrl };
    }
    return undefined;
  } catch {
    return undefined;
  }
};

export const isImage = (file: FileValue): boolean =>
  file.mime.startsWith('image/');

export const formatSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
};

/** What a value displays as when it names a file — the decoded name, or
 *  the raw value itself (a typed/legacy filename). */
export const fileDisplayName = (value: string): string =>
  decodeFileValue(value)?.name ?? value;
