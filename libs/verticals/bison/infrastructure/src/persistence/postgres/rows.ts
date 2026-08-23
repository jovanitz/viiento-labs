import type {
  Client,
  ClientChannels,
  ClientId,
  Entry,
  EntryField,
  EntryId,
  Template,
  TemplateBlock,
  TemplateColor,
  TemplateIcon,
  TemplateId,
  TemplateKind,
} from '@acme/bison-domain';
import type { Row } from 'postgres';

/**
 * Row ↔ domain mapping for the bison tables. Postgres returns timestamptz
 * as Date and jsonb parsed; the domain speaks ISO strings and readonly
 * arrays. (Local twin of the core access rows.ts helpers — same rules.)
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** uuid columns reject malformed ids with an error; a miss must be null. */
export const isUuid = (raw: string): boolean => UUID_RE.test(raw);

export const isoOf = (value: Date | string): string =>
  new Date(value).toISOString();

export const templateFromRow = (row: Row): Template => ({
  id: row['id'] as TemplateId,
  name: row['name'] as string,
  description: row['description'] as string,
  icon: row['icon'] as TemplateIcon,
  color: row['color'] as TemplateColor,
  kind: row['kind'] as TemplateKind,
  blocks: row['blocks'] as readonly TemplateBlock[],
  createdAt: isoOf(row['created_at'] as Date),
  updatedAt: isoOf(row['updated_at'] as Date),
});

export const clientFromRow = (row: Row): Client => ({
  id: row['id'] as ClientId,
  name: row['name'] as string,
  phone: row['phone'] as string,
  photoPath: (row['photo_path'] as string | null) ?? undefined,
  channels: row['channels'] as ClientChannels,
  createdAt: isoOf(row['created_at'] as Date),
  updatedAt: isoOf(row['updated_at'] as Date),
});

export const entryFromRow = (row: Row): Entry => ({
  id: row['id'] as EntryId,
  clientId: row['client_id'] as ClientId,
  templateId: row['template_id'] as TemplateId,
  templateName: row['template_name'] as string,
  icon: row['icon'] as TemplateIcon,
  color: row['color'] as TemplateColor,
  at: isoOf(row['at'] as Date),
  summary: row['summary'] as string,
  fields: row['fields'] as readonly EntryField[],
});
