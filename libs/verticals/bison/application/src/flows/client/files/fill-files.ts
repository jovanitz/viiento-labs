import { type Result, err, ok } from '@acme/shared';
import { decodeFileRef } from '@acme/bison-domain';
import type { FillValues } from '@acme/bison-domain';
import { bisonGatewayError } from '../../../client/gateway';
import type { BisonGatewayError } from '../../../client/gateway';
import type { BisonClientFlowDeps } from '../deps';

/**
 * Captured-file staging for a fill. The fill FORM stays storage-free (the
 * prototype's contract): a picked file rides inside its block's string
 * value as `{kind:'file', name, mime, size, dataUrl}`. Logging is when the
 * bytes actually leave the device — this helper finds those pending
 * values, uploads each through `bison.files.attach`, and swaps in the
 * returned FileRef value (storagePath, no bytes). Values that aren't a
 * pending file — plain text, already-stored refs — pass through untouched.
 *
 * Headless on purpose: the conversational interface stages incoming media
 * through the SAME path.
 */
type PendingFile = {
  readonly name: string;
  readonly mime: string;
  readonly bytesBase64: string;
};

const DATA_URL_RE = /^data:([^;,]+);base64,(.+)$/;

/** The prototype's captured-file envelope, still carrying its bytes. */
export const pendingFileOf = (value: string): PendingFile | null => {
  if (!value.startsWith('{')) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as { kind?: unknown }).kind !== 'file' ||
      typeof (parsed as { name?: unknown }).name !== 'string' ||
      typeof (parsed as { dataUrl?: unknown }).dataUrl !== 'string'
    ) {
      return null;
    }
    const { name, dataUrl } = parsed as {
      readonly name: string;
      readonly dataUrl: string;
    };
    const match = DATA_URL_RE.exec(dataUrl);
    if (!match) return null;
    return { name, mime: match[1] as string, bytesBase64: match[2] as string };
  } catch {
    return null;
  }
};

/** Upload every pending file in the fill; the first failure aborts the
 *  whole log (a half-stored entry would lie). */
export const storeFillFiles = async (
  deps: BisonClientFlowDeps,
  clientId: string,
  values: FillValues,
): Promise<Result<FillValues, BisonGatewayError>> => {
  const stored: Record<string, string> = {};
  for (const [blockId, value] of Object.entries(values)) {
    const pending = pendingFileOf(value);
    if (!pending) {
      stored[blockId] = value;
      continue;
    }
    const attached = await deps.gateway.files.attach({
      clientId,
      ...pending,
    });
    if (!attached.ok) return err(attached.error);
    stored[blockId] = attached.value;
  }
  return ok(stored);
};

/** Resolve a stored value's path to a short-lived signed URL — the read
 *  half of the staging above (downloads, previews, the printed page). */
export const getFileUrl = (
  deps: BisonClientFlowDeps,
  input: { readonly storagePath: string },
): Promise<Result<string, BisonGatewayError>> =>
  deps.gateway.files.url(input);

/** Upload a freshly picked client photo (a raw data URL from the picker)
 *  and hand back its storage path — the value the client row persists. */
export const storeClientPhoto = async (
  deps: BisonClientFlowDeps,
  clientId: string,
  dataUrl: string,
): Promise<Result<string, BisonGatewayError>> => {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) {
    return err(bisonGatewayError('Not an inline image — pick the photo again.'));
  }
  const attached = await deps.gateway.files.attach({
    clientId,
    name: 'photo',
    mime: match[1] as string,
    bytesBase64: match[2] as string,
  });
  if (!attached.ok) return err(attached.error);
  const ref = decodeFileRef(attached.value);
  if (!ref) {
    return err(bisonGatewayError('Stored photo came back unreadable.'));
  }
  return ok(ref.storagePath);
};
