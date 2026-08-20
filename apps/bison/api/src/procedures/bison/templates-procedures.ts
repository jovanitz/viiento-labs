import { z } from 'zod';
import { ok } from '@acme/shared';
import {
  FIELD_KINDS,
  FIELD_WIDTHS,
  TEMPLATE_COLORS,
  TEMPLATE_ICONS,
} from '@acme/bison-domain';
import type {
  FieldKind,
  FieldWidth,
  TemplateColor,
  TemplateIcon,
} from '@acme/bison-domain';
import type { TemplateChanges } from '@acme/bison-domain';
import type { TemplateBlockInput } from '@acme/bison-application';
import { defineApiProcedure } from '../../rpc/procedure';
import type { ApiProcedure } from '../../rpc/procedure';
import { bisonUseCasesOf, definedOnly, deniedIfBlocked } from './context';
import type { BisonProcedureDeps } from './context';

const iconSchema = z.enum(TEMPLATE_ICONS as [TemplateIcon, ...TemplateIcon[]]);
const colorSchema = z.enum(
  TEMPLATE_COLORS as [TemplateColor, ...TemplateColor[]],
);
const kindSchema = z.enum(FIELD_KINDS as [FieldKind, ...FieldKind[]]);
const widthSchema = z.enum(FIELD_WIDTHS as [FieldWidth, ...FieldWidth[]]);

/** A block as the builder submits it — id optional (the conversational
 *  interface never rendered a form); the use case assigns one. */
const blockSchema = z
  .object({
    id: z.string().min(1).max(64).optional(),
    kind: kindSchema,
    label: z.string().min(1).max(200),
    required: z.boolean().optional(),
    width: widthSchema,
    options: z.array(z.string().min(1).max(120)).max(50).optional(),
  })
  .strict();

const blocksSchema = z.array(blockSchema).max(100);

const toBlockInput = (block: z.infer<typeof blockSchema>): TemplateBlockInput =>
  definedOnly({
    id: block.id,
    kind: block.kind,
    label: block.label,
    required: block.required,
    width: block.width,
    options: block.options,
  }) as TemplateBlockInput;

const listTemplates = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.templates.list',
    summary:
      "The account's template library, defaults first then customs by name.",
    action: null,
    input: z.object({}).strict(),
    handler: async ({ actor }) =>
      deniedIfBlocked(actor) ??
      ok(await bisonUseCasesOf(deps, actor).templates.list()),
  });

const getTemplate = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.templates.get',
    summary: 'One template, schema included.',
    action: null,
    input: z.object({ id: z.string().min(1) }).strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).templates.get({ id: input.id }),
  });

const createTemplate = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.templates.create',
    summary:
      'Create a custom template: identity (name/icon/color) + the ordered ' +
      'capture schema. The schema is validated as a whole (labels, choice ' +
      'options, at least one capturing block).',
    action: null,
    input: z
      .object({
        name: z.string().min(1).max(80),
        description: z.string().max(500).default(''),
        icon: iconSchema,
        color: colorSchema,
        blocks: blocksSchema,
      })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).templates.create({
        name: input.name,
        description: input.description,
        icon: input.icon,
        color: input.color,
        blocks: input.blocks.map(toBlockInput),
      }),
  });

const updateTemplate = (deps: BisonProcedureDeps): ApiProcedure =>
  defineApiProcedure({
    name: 'bison.templates.update',
    summary:
      'Edit a CUSTOM template (identity and/or schema); shipped defaults ' +
      'are refused by the domain.',
    action: null,
    input: z
      .object({
        id: z.string().min(1),
        changes: z
          .object({
            name: z.string().min(1).max(80).optional(),
            description: z.string().max(500).optional(),
            icon: iconSchema.optional(),
            color: colorSchema.optional(),
            blocks: blocksSchema.optional(),
          })
          .strict(),
      })
      .strict(),
    handler: async ({ actor, input }) =>
      deniedIfBlocked(actor) ??
      bisonUseCasesOf(deps, actor).templates.update({
        id: input.id,
        changes: definedOnly({
          name: input.changes.name,
          description: input.changes.description,
          icon: input.changes.icon,
          color: input.changes.color,
          blocks: input.changes.blocks?.map(toBlockInput),
        }) as TemplateChanges,
      }),
  });

/**
 * The account's template library (the client app's dynamic forms). No
 * `action`: any member of the individual account operates its own world —
 * tenancy is the authorization, enforced by the per-account store scoping.
 */
export const createBisonTemplateProcedures = (
  deps: BisonProcedureDeps,
): ReadonlyArray<ApiProcedure> => [
  listTemplates(deps),
  getTemplate(deps),
  createTemplate(deps),
  updateTemplate(deps),
];
