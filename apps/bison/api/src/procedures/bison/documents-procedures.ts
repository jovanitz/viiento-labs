import { z } from 'zod';
import { ok } from '@acme/shared';
import type { SaveFormatInput } from '@acme/bison-application';
import { defineApiProcedure } from '../../rpc/procedure';
import type { ApiProcedure } from '../../rpc/procedure';
import { bisonUseCasesOf, definedOnly, deniedIfBlocked } from './context';
import type { BisonProcedureDeps } from './context';

const tokenSchema = z.enum([
  'business.name',
  'business.address',
  'business.phone',
  'client.name',
  'document.folio',
  'document.issuedAt',
]);

const markSchema = z
  .object({
    id: z.string().min(1).max(64),
    asset: z.enum(['logo', 'signature', 'seal', 'qr']),
    region: z.enum(['header', 'footer']),
    corner: z.enum(['left', 'center', 'right']),
    caption: z.string().max(200).optional(),
  })
  .strict();

const listFormats = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.formats.list',
    summary:
      "The account's document formats (ADR-0021 wrappers). Shipped " +
      'starting points live in the app; rows here are the business’s own, ' +
      'with shippedKey provenance when they override one.',
    action: null,
    input: z.object({}).strict(),
    handler: async ({ actor }) =>
      deniedIfBlocked(actor) ??
      ok(await bisonUseCasesOf(deps, actor).formats.list()),
  });

const saveFormat = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.formats.save',
    summary:
      'Persist a format: update when existingId names a backend row, ' +
      'create otherwise (editing a shipped starting point creates a ' +
      'copy-on-write row carrying its shippedKey).',
    action: null,
    input: z
      .object({
        existingId: z.string().min(1).optional(),
        shippedKey: z.string().min(1).max(64).optional(),
        name: z.string().min(1).max(80),
        themeId: z.string().min(1).max(40),
        paper: z.enum(['letter', 'a4', 'half-letter']),
        headerTokens: z.array(tokenSchema).max(6),
        footerTokens: z.array(tokenSchema).max(6),
        marks: z.array(markSchema).max(4),
      })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).formats.save(
        definedOnly(input) as SaveFormatInput,
      ),
  });

/** Document formats — same tenancy-is-authorization stance. */
export const createBisonDocumentProcedures = (
  deps: BisonProcedureDeps,
): ReadonlyArray<ApiProcedure> => [listFormats(deps), saveFormat(deps)];
