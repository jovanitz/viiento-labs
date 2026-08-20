import { z } from 'zod';
import { defineApiProcedure } from '../../rpc/procedure';
import type { ApiProcedure } from '../../rpc/procedure';
import { bisonUseCasesOf, deniedIfBlocked } from './context';
import type { BisonProcedureDeps } from './context';

/** ~5 MB of raw bytes once base64 is decoded — enough for phone photos and
 *  PDFs through JSON-RPC; bigger files should wait for the direct-to-storage
 *  signed-upload flow. */
const MAX_BASE64_CHARS = 7_000_000;

const MIME_RE = /^[-\w.+]+\/[-\w.+]+$/;

const attachFile = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.files.attach',
    summary:
      "Store a captured file (image/document) in the account's bucket and " +
      'return the encoded FileRef string — the value a `file` block holds. ' +
      'The client must exist in this account.',
    action: null,
    input: z
      .object({
        clientId: z.string().min(1),
        name: z.string().min(1).max(200),
        mime: z.string().regex(MIME_RE),
        bytesBase64: z.string().min(1).max(MAX_BASE64_CHARS),
      })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).files.attach({
        clientId: input.clientId,
        name: input.name,
        mime: input.mime,
        bytes: Uint8Array.from(Buffer.from(input.bytesBase64, 'base64')),
      }),
  });

const fileUrl = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.files.url',
    summary:
      "Resolve a FileRef's storagePath to a short-lived signed URL. Only " +
      "paths whose client exists in this account's world are signed.",
    action: null,
    input: z
      .object({
        storagePath: z.string().min(1).max(300),
        expiresInSeconds: z.number().int().min(30).max(3600).optional(),
      })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).files.url({
        storagePath: input.storagePath,
        ...(input.expiresInSeconds !== undefined
          ? { expiresInSeconds: input.expiresInSeconds }
          : {}),
      }),
  });

/** Captured files: bytes in via base64 (for now), reads via signed URLs. */
export const createBisonFileProcedures = (
  deps: BisonProcedureDeps,
): ReadonlyArray<ApiProcedure> => [attachFile(deps), fileUrl(deps)];
