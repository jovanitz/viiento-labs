import { z } from 'zod';
import { ok } from '@acme/shared';
import type { ClientContactChanges } from '@acme/bison-domain';
import { defineApiProcedure } from '../../rpc/procedure';
import type { ApiProcedure } from '../../rpc/procedure';
import { bisonUseCasesOf, definedOnly, deniedIfBlocked } from './context';
import type { BisonProcedureDeps } from './context';

const nameSchema = z.string().min(1).max(120);
const phoneSchema = z.string().max(40);

const listClients = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.clients.list',
    summary: "The account's client roster, by name.",
    action: null,
    input: z.object({}).strict(),
    handler: async ({ actor }) =>
      deniedIfBlocked(actor) ??
      ok(await bisonUseCasesOf(deps, actor).clients.list()),
  });

const getClient = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.clients.get',
    summary: "One client's card (identity, phone, channels).",
    action: null,
    input: z.object({ id: z.string().min(1) }).strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).clients.get({ id: input.id }),
  });

const createClient = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.clients.create',
    summary:
      'Add a client to the roster. Channels are born not_connected; the ' +
      'messaging feature verifies them later.',
    action: null,
    input: z
      .object({ name: nameSchema, phone: phoneSchema.optional() })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).clients.create({
        name: input.name,
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      }),
  });

const updateClientContact = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.clients.updateContact',
    summary: "Update a client's name and/or phone.",
    action: null,
    input: z
      .object({
        id: z.string().min(1),
        changes: z
          .object({
            name: nameSchema.optional(),
            phone: phoneSchema.optional(),
            // A storage path under the client's own prefix ('' clears);
            // the domain rejects paths outside clients/<id>/.
            photoPath: z.string().max(300).optional(),
          })
          .strict(),
      })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).clients.updateContact({
        id: input.id,
        changes: definedOnly({
          name: input.changes.name,
          phone: input.changes.phone,
          photoPath: input.changes.photoPath,
        }) as ClientContactChanges,
      }),
  });

/** The client roster — same tenancy-is-authorization stance as templates. */
export const createBisonClientProcedures = (
  deps: BisonProcedureDeps,
): ReadonlyArray<ApiProcedure> => [
  listClients(deps),
  getClient(deps),
  createClient(deps),
  updateClientContact(deps),
];
