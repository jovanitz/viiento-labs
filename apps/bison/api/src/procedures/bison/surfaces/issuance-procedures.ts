import { z } from 'zod';
import { ok } from '@acme/shared';
import { defineApiProcedure } from '../../../rpc/procedure';
import type { ApiProcedure } from '../../../rpc/procedure';
import { bisonUseCasesOf, deniedIfBlocked } from '../context';
import type { BisonProcedureDeps } from '../context';

/**
 * Formal issuance (ADR-0020 §7). Two phases: `issue` allocates the folio
 * and freezes the snapshot server-side; the CLIENT renders the PDF (it
 * owns the engine + fonts) and `attachPdf` lands the bytes in storage.
 * A failed phase 2 leaves an auditable folio gap, never a collision.
 * Voiding is the only mutation an issue ever sees.
 */
const issueDocument = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.documents.issue',
    summary:
      'Allocate the next folio and freeze the snapshot for one timeline ' +
      'entry × format. Returns the resolved tokens the renderer composes with.',
    action: null,
    input: z
      .object({ entryId: z.string().min(1), formatId: z.string().min(1) })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).issuance.issue({
        entryId: input.entryId,
        formatId: input.formatId,
        issuedBy: actor.membership.userId,
      }),
  });

/** ~7MB of base64 ≈ the 5MB byte cap the attach path also lives with. */
const attachIssuedPdf = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.documents.attachPdf',
    summary: "Land an issue's rendered PDF bytes in storage, exactly once.",
    action: null,
    input: z
      .object({
        issueId: z.string().min(1),
        bytesBase64: z.string().min(1).max(7_000_000),
      })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).issuance.attachPdf({
        issueId: input.issueId,
        bytes: Uint8Array.from(Buffer.from(input.bytesBase64, 'base64')),
      }),
  });

const voidIssue = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.documents.void',
    summary:
      'Void an issue (optionally superseded by its replacement). Issues ' +
      'are never edited or deleted — the folio stays on record.',
    action: null,
    input: z
      .object({
        issueId: z.string().min(1),
        supersededBy: z.string().min(1).optional(),
      })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).issuance.voidIssue({
        issueId: input.issueId,
        ...(input.supersededBy !== undefined
          ? { supersededBy: input.supersededBy }
          : {}),
      }),
  });

const listIssues = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.documents.issues',
    summary: "One entry's issues, newest folio first.",
    action: null,
    input: z.object({ entryId: z.string().min(1) }).strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      ok(
        await bisonUseCasesOf(deps, actor).issuance.list({
          entryId: input.entryId,
        }),
      ),
  });

export const createBisonIssuanceProcedures = (
  deps: BisonProcedureDeps,
): ReadonlyArray<ApiProcedure> => [
  issueDocument(deps),
  attachIssuedPdf(deps),
  voidIssue(deps),
  listIssues(deps),
];
