import { z } from 'zod';
import type { FlowCommand } from '@acme/application';
import {
  FIELD_KINDS,
  FIELD_WIDTHS,
  TEMPLATE_COLORS,
  TEMPLATE_ICONS,
} from '@acme/bison-domain';
import type {
  BusinessIdentityChanges,
  FieldKind,
  FieldWidth,
  TemplateColor,
  TemplateIcon,
} from '@acme/bison-domain';
import type { BisonClientFlowDeps } from './clients';
import {
  createClient,
  loadClientDetail,
  loadClients,
  logTimelineEntry,
  updateClientContact,
} from './clients';
import {
  loadFormats,
  loadTemplates,
  saveFormat,
  saveTemplate,
} from './templates';
import type { SaveTemplateInput } from './templates';
import type { SaveFormatInput } from '../../documents/use-cases';
import { loadIdentity, saveIdentity } from './account/identity';
import { AGENDA_FLOWS } from './agenda/registry-agenda';

/**
 * The bison CLIENT app's flow catalog (ADR-0017: each giro's apps own their
 * registries). A UI store calls the typed controllers directly; a future
 * bison MCP server iterates THIS list to expose one tool per entry — the
 * conversational interface reuses the exact orchestration the screens use.
 */
const empty = z.object({});
const clientIdInput = z.object({ clientId: z.string().min(1) });
const createClientInput = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
});
const updateContactInput = z.object({
  id: z.string().min(1),
  changes: z
    .object({
      name: z.string().min(1).optional(),
      phone: z.string().optional(),
    })
    .strict(),
});
const logEntryInput = z.object({
  clientId: z.string().min(1),
  templateId: z.string().min(1),
  values: z.record(z.string()),
});
const saveTemplateInput = z.object({
  existingId: z.string().min(1).optional(),
  name: z.string().min(1).max(80),
  description: z.string().max(500),
  icon: z.enum(TEMPLATE_ICONS as [TemplateIcon, ...TemplateIcon[]]),
  color: z.enum(TEMPLATE_COLORS as [TemplateColor, ...TemplateColor[]]),
  blocks: z
    .array(
      z
        .object({
          id: z.string().min(1).max(64),
          kind: z.enum(FIELD_KINDS as [FieldKind, ...FieldKind[]]),
          label: z.string().min(1).max(200),
          required: z.boolean().optional(),
          width: z.enum(FIELD_WIDTHS as [FieldWidth, ...FieldWidth[]]),
          options: z.array(z.string().min(1).max(120)).max(50).optional(),
        })
        .strict(),
    )
    .max(100),
});

export const BISON_CLIENT_FLOWS: ReadonlyArray<
  FlowCommand<BisonClientFlowDeps>
> = [
  {
    name: 'bison.clients.board',
    kind: 'query',
    description: 'The client roster with its summary line.',
    input: empty,
    run: (deps) => loadClients(deps),
  },
  {
    name: 'bison.clients.detail',
    kind: 'query',
    description:
      "One client's card + their timeline grouped by day + the template " +
      'library for the add-entry picker.',
    input: clientIdInput,
    run: (deps, input) => loadClientDetail(deps, input as { clientId: string }),
  },
  {
    name: 'bison.clients.createClient',
    kind: 'command',
    description: 'Add a client to the roster (name, optional phone).',
    input: createClientInput,
    run: (deps, input) =>
      createClient(deps, input as { name: string; phone?: string }),
  },
  {
    name: 'bison.clients.updateContact',
    kind: 'command',
    description: "Update a client's contact card (name and/or phone).",
    input: updateContactInput,
    run: (deps, input) =>
      updateClientContact(
        deps,
        input as Parameters<typeof updateClientContact>[1],
      ),
  },
  {
    name: 'bison.timeline.logEntry',
    kind: 'command',
    description:
      "Fill a template onto a client's timeline (append-only; corrections " +
      'are new entries).',
    input: logEntryInput,
    run: (deps, input) =>
      logTimelineEntry(deps, input as Parameters<typeof logTimelineEntry>[1]),
  },
  {
    name: 'bison.templates.board',
    kind: 'query',
    description: 'The template library, defaults first then customs by name.',
    input: empty,
    run: (deps) => loadTemplates(deps),
  },
  {
    name: 'bison.templates.save',
    kind: 'command',
    description:
      'Persist what the Builder produced: update when existingId names a ' +
      'backend template, create otherwise (block ids are kept — entries ' +
      'reference them).',
    input: saveTemplateInput,
    run: (deps, input) => saveTemplate(deps, input as SaveTemplateInput),
  },
  {
    name: 'bison.formats.board',
    kind: 'query',
    description:
      "The account's document formats (backend rows only — the shipped " +
      'catalog is app-side).',
    input: empty,
    run: (deps) => loadFormats(deps),
  },
  {
    name: 'bison.formats.save',
    kind: 'command',
    description:
      'Persist a format: update by existingId, create otherwise (editing ' +
      'a shipped starting point creates a copy-on-write row).',
    input: z.object({
      existingId: z.string().min(1).optional(),
      shippedKey: z.string().min(1).max(64).optional(),
      name: z.string().min(1).max(80),
      themeId: z.string().min(1).max(40),
      paper: z.enum(['letter', 'a4', 'half-letter']),
      headerTokens: z.array(z.string()).max(6),
      footerTokens: z.array(z.string()).max(6),
      marks: z.array(z.record(z.unknown())).max(4),
    }),
    run: (deps, input) => saveFormat(deps, input as SaveFormatInput),
  },
  {
    name: 'bison.identity.get',
    kind: 'query',
    description:
      "The business's identity on file — empty fields mean the business " +
      'has not filled them yet; the app never invents a letterhead.',
    input: z.object({}),
    run: (deps) => loadIdentity(deps),
  },
  {
    name: 'bison.identity.update',
    kind: 'command',
    description:
      "Update the business's identity (name, address, phone, license, " +
      "logo path). Partial: absent fields keep their value, '' clears.",
    input: z.object({
      changes: z.object({
        name: z.string().max(120).optional(),
        address: z.string().max(240).optional(),
        phone: z.string().max(40).optional(),
        license: z.string().max(120).optional(),
        logoPath: z.string().max(300).optional(),
      }),
    }),
    run: (deps, input) =>
      saveIdentity(deps, input as { changes: BusinessIdentityChanges }),
  },
  ...AGENDA_FLOWS,
];
