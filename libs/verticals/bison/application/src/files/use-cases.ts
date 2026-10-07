import { type IdGenerator, type Result, err, ok } from '@acme/shared';
import type { FileStorage } from '@acme/application';
import { encodeFileRef, makeClientId } from '@acme/bison-domain';
import type { IssuedDocumentId } from '@acme/bison-domain';
import { clientNotFound } from '../clients/errors';
import type { ClientRepository } from '../clients/ports';
import type { IssuedDocumentRepository } from '../documents/ports';
import { type FileUseCaseError, filePathInvalid, fileTooLarge } from './errors';

export type FileUseCaseDeps = {
  readonly files: FileStorage;
  readonly clients: ClientRepository;
  readonly issued: IssuedDocumentRepository;
  readonly ids: IdGenerator;
};

/**
 * The ceiling for any captured file, enforced on BOTH upload paths — the
 * base64 attach AND the direct-to-bucket slot, which otherwise has no
 * limit at all once real object storage is wired. Images arrive far below
 * it (the ui downscales at capture); this is what stops a video.
 */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const tooLarge = (size: number) =>
  fileTooLarge(
    `File is ${size} bytes; the limit is ${MAX_FILE_BYTES}.`,
  );

const PATH_RE = /^clients\/([^/]+)\/[^/]+$/;
const ISSUED_PATH_RE = /^issued\/([^/]+)$/;
/** How long a signed URL stays valid. Long enough that a viewer's CDN
 *  can actually reuse it (the ui caches the URL for less than this), short
 *  enough that a leaked link dies the same day. */
const DEFAULT_URL_TTL_SECONDS = 60 * 60;

/**
 * Store a captured file's bytes and hand back the encoded `FileRef` string
 * — exactly what a `file` block's value holds in `FillValues`. The storage
 * path is opaque and collision-free (`clients/<clientId>/<fileId>`): the
 * human-facing name travels inside the ref, never inside the path, so no
 * filename sanitization is ever needed. The client must exist in this
 * account's world — that check is what scopes a path to its tenant.
 */
export const makeAttachFile =
  (deps: FileUseCaseDeps) =>
  async (input: {
    readonly clientId: string;
    readonly name: string;
    readonly mime: string;
    readonly bytes: Uint8Array;
  }): Promise<Result<string, FileUseCaseError>> => {
    if (input.bytes.byteLength > MAX_FILE_BYTES) {
      return err(tooLarge(input.bytes.byteLength));
    }
    const clientId = makeClientId(input.clientId);
    if (!clientId.ok) return err(clientId.error);
    const client = await deps.clients.findById(clientId.value);
    if (!client) {
      return err(clientNotFound(`No client with id ${input.clientId}.`));
    }

    const path = `clients/${clientId.value}/${deps.ids.next()}`;
    const stored = await deps.files.put({
      path,
      bytes: input.bytes,
      mime: input.mime,
    });
    if (!stored.ok) return err(stored.error);

    return ok(
      encodeFileRef({
        name: input.name,
        mime: input.mime,
        size: input.bytes.byteLength,
        storagePath: path,
      }),
    );
  };

/**
 * Resolve a stored `FileRef` path to a short-lived signed URL. The path must
 * name a client that exists in THIS account's world — signing someone else's
 * path is impossible even with a leaked value.
 */
export const makeGetFileUrl =
  (deps: FileUseCaseDeps) =>
  async (input: {
    readonly storagePath: string;
    readonly expiresInSeconds?: number;
  }): Promise<Result<string, FileUseCaseError>> => {
    // Issued-document bytes: the path is owned by the issue row, which
    // only exists inside this account's world.
    const issuedMatch = ISSUED_PATH_RE.exec(input.storagePath);
    if (issuedMatch) {
      const issue = await deps.issued.findById(
        issuedMatch[1] as IssuedDocumentId,
      );
      if (!issue || issue.pdfPath !== input.storagePath) {
        return err(
          filePathInvalid(`Not a stored file path: ${input.storagePath}.`),
        );
      }
      return deps.files.getSignedUrl({
        path: input.storagePath,
        expiresInSeconds: input.expiresInSeconds ?? DEFAULT_URL_TTL_SECONDS,
      });
    }
    const match = PATH_RE.exec(input.storagePath);
    const rawClientId = match?.[1];
    if (!rawClientId) {
      return err(
        filePathInvalid(`Not a stored file path: ${input.storagePath}.`),
      );
    }
    const clientId = makeClientId(rawClientId);
    if (!clientId.ok) return err(clientId.error);
    const client = await deps.clients.findById(clientId.value);
    if (!client) {
      return err(clientNotFound(`No client with id ${rawClientId}.`));
    }

    return deps.files.getSignedUrl({
      path: input.storagePath,
      expiresInSeconds: input.expiresInSeconds ?? DEFAULT_URL_TTL_SECONDS,
    });
  };

/**
 * Reserve a direct-upload slot: server-generated path + a one-shot signed
 * URL the client PUTs the raw bytes to, plus the encoded FileRef value the
 * block will hold once the upload lands. Fails on adapters without a
 * reachable upload endpoint (in-memory dev) — callers fall back to
 * `attach`.
 */
export const makeCreateUploadSlot =
  (deps: FileUseCaseDeps) =>
  async (input: {
    readonly clientId: string;
    readonly name: string;
    readonly mime: string;
    readonly size: number;
  }): Promise<
    Result<
      { readonly uploadUrl: string; readonly value: string },
      FileUseCaseError
    >
  > => {
    if (input.size > MAX_FILE_BYTES) return err(tooLarge(input.size));
    const clientId = makeClientId(input.clientId);
    if (!clientId.ok) return err(clientId.error);
    const client = await deps.clients.findById(clientId.value);
    if (!client) {
      return err(clientNotFound(`No client with id ${input.clientId}.`));
    }

    const path = `clients/${clientId.value}/${deps.ids.next()}`;
    const signed = await deps.files.createSignedUploadUrl({ path });
    if (!signed.ok) return err(signed.error);

    return ok({
      uploadUrl: signed.value,
      value: encodeFileRef({
        name: input.name,
        mime: input.mime,
        size: input.size,
        storagePath: path,
      }),
    });
  };

export type FileUseCases = {
  readonly attach: ReturnType<typeof makeAttachFile>;
  readonly url: ReturnType<typeof makeGetFileUrl>;
  readonly uploadSlot: ReturnType<typeof makeCreateUploadSlot>;
};

export const makeFileUseCases = (deps: FileUseCaseDeps): FileUseCases => ({
  attach: makeAttachFile(deps),
  url: makeGetFileUrl(deps),
  uploadSlot: makeCreateUploadSlot(deps),
});
