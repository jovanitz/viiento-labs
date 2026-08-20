/**
 * The value a `file` block captures, encoded INSIDE the ordinary string
 * value every other kind uses — so entries keep their one value shape
 * (`FillValues` stays `Record<string, string>`) and only presenters decode.
 *
 * Unlike the UI prototype's `FileValue` (which embedded a `dataUrl` so it
 * needed no storage), the domain shape carries a `storagePath`: the file's
 * bytes live in object storage behind the `FileStorage` port, and readers
 * resolve the path to a signed URL (or a local cache, offline) when they
 * actually need the content.
 *
 * A value that fails to decode (a typed/legacy filename) is not an error —
 * presenters fall back to showing it as a plain name.
 */

export type FileRef = {
  readonly name: string;
  readonly mime: string;
  /** Bytes. */
  readonly size: number;
  /** Where the content lives, relative to the account's storage root. */
  readonly storagePath: string;
};

export const encodeFileRef = (ref: FileRef): string =>
  JSON.stringify({ kind: 'file', ...ref });

export const decodeFileRef = (value: string): FileRef | undefined => {
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
      typeof (parsed as { storagePath?: unknown }).storagePath === 'string'
    ) {
      const { name, mime, size, storagePath } = parsed as FileRef;
      return { name, mime, size, storagePath };
    }
    return undefined;
  } catch {
    return undefined;
  }
};

export const isImageRef = (ref: FileRef): boolean =>
  ref.mime.startsWith('image/');

/** What a value displays as when it names a file — the decoded name, or
 *  the raw value itself (a typed/legacy filename). */
export const fileDisplayName = (value: string): string =>
  decodeFileRef(value)?.name ?? value;
