import postgres from 'postgres';
import type { Sql } from 'postgres';
import type {
  ClientRepository,
  EntryRepository,
  TemplateRepository,
} from '@acme/bison-application';
import type { BisonAccountStore } from '../in-memory-bison-store';
import { appointmentsRepo } from './appointments';
import { calendarBlocksRepo } from './calendar-blocks';
import { formatsRepo } from './formats';
import { clientFromRow, entryFromRow, isUuid, templateFromRow } from './rows';

/**
 * The Postgres/Supabase implementation of the bison repositories — same
 * contract as the in-memory store. The connection string is the *service*
 * connection (bypasses RLS): authorization is enforced in the application
 * layer per request; RLS is the fail-closed second line for anything that
 * talks to PostgREST directly.
 *
 * `forAccount` scopes the three repositories to one account — the API
 * resolves the actor's account per request and builds a scoped bundle;
 * cross-account reads are impossible by construction.
 *
 * `close()` drains the pool — call it on app shutdown (and afterAll in
 * specs).
 */
export type PostgresBisonStore = {
  readonly forAccount: (accountId: string) => BisonAccountStore;
  readonly close: () => Promise<void>;
};

const templatesRepo = (sql: Sql, accountId: string): TemplateRepository => ({
  findById: async (id) => {
    if (!isUuid(id)) return null;
    const rows = await sql`
      select * from public.bison_templates
      where id = ${id} and account_id = ${accountId} limit 1
    `;
    return rows[0] ? templateFromRow(rows[0]) : null;
  },
  list: async () => {
    const rows = await sql`
      select * from public.bison_templates
      where account_id = ${accountId}
      order by (kind = 'custom') asc, name asc
    `;
    return rows.map(templateFromRow);
  },
  save: async (template) => {
    await sql`
      insert into public.bison_templates
        (id, account_id, name, description, icon, color, kind, blocks,
         created_at, updated_at)
      values
        (${template.id}, ${accountId}, ${template.name},
         ${template.description}, ${template.icon}, ${template.color},
         ${template.kind}, ${JSON.stringify(template.blocks)}::jsonb,
         ${template.createdAt}, ${template.updatedAt})
      on conflict (id) do update set
        name = excluded.name,
        description = excluded.description,
        icon = excluded.icon,
        color = excluded.color,
        kind = excluded.kind,
        blocks = excluded.blocks,
        updated_at = excluded.updated_at
      where bison_templates.account_id = excluded.account_id
    `;
  },
});

const clientsRepo = (sql: Sql, accountId: string): ClientRepository => ({
  findById: async (id) => {
    if (!isUuid(id)) return null;
    const rows = await sql`
      select * from public.bison_clients
      where id = ${id} and account_id = ${accountId} limit 1
    `;
    return rows[0] ? clientFromRow(rows[0]) : null;
  },
  list: async () => {
    const rows = await sql`
      select * from public.bison_clients
      where account_id = ${accountId}
      order by name asc
    `;
    return rows.map(clientFromRow);
  },
  save: async (client) => {
    await sql`
      insert into public.bison_clients
        (id, account_id, name, phone, photo_path, channels,
         created_at, updated_at)
      values
        (${client.id}, ${accountId}, ${client.name}, ${client.phone},
         ${client.photoPath ?? null},
         ${JSON.stringify(client.channels)}::jsonb,
         ${client.createdAt}, ${client.updatedAt})
      on conflict (id) do update set
        name = excluded.name,
        phone = excluded.phone,
        photo_path = excluded.photo_path,
        channels = excluded.channels,
        updated_at = excluded.updated_at
      where bison_clients.account_id = excluded.account_id
    `;
  },
});

const entriesRepo = (sql: Sql, accountId: string): EntryRepository => ({
  append: async (entry) => {
    await sql`
      insert into public.bison_timeline_entries
        (id, account_id, client_id, template_id, template_name, icon, color,
         at, summary, fields)
      values
        (${entry.id}, ${accountId}, ${entry.clientId}, ${entry.templateId},
         ${entry.templateName}, ${entry.icon}, ${entry.color}, ${entry.at},
         ${entry.summary}, ${JSON.stringify(entry.fields)}::jsonb)
    `;
  },
  listByClient: async (clientId) => {
    if (!isUuid(clientId)) return [];
    const rows = await sql`
      select * from public.bison_timeline_entries
      where client_id = ${clientId} and account_id = ${accountId}
      order by at desc, id desc
    `;
    return rows.map(entryFromRow);
  },
});

export const createPostgresBisonStore = (config: {
  readonly databaseUrl: string;
  readonly maxConnections?: number;
}): PostgresBisonStore => {
  const sql = postgres(config.databaseUrl, {
    max: config.maxConnections ?? 4,
    onnotice: () => undefined,
  });
  return {
    forAccount: (accountId) => ({
      templates: templatesRepo(sql, accountId),
      clients: clientsRepo(sql, accountId),
      entries: entriesRepo(sql, accountId),
      appointments: appointmentsRepo(sql, accountId),
      calendarBlocks: calendarBlocksRepo(sql, accountId),
      formats: formatsRepo(sql, accountId),
    }),
    close: () => sql.end(),
  };
};
