import type { Row, Sql } from 'postgres';
import type { DocumentFormatRepository } from '@acme/bison-application';
import type {
  DocumentFormat,
  DocumentFormatId,
  DocumentToken,
  FormatMark,
  PaperKind,
} from '@acme/bison-domain';
import { isUuid, isoOf } from './rows';

/** Postgres `DocumentFormatRepository` — token lists and marks live in
 *  jsonb columns; `shipped_key` carries the copy-on-write provenance. */
const formatFromRow = (row: Row): DocumentFormat => ({
  id: row['id'] as DocumentFormatId,
  name: row['name'] as string,
  themeId: row['theme_id'] as string,
  paper: row['paper'] as PaperKind,
  headerTokens: row['header_tokens'] as readonly DocumentToken[],
  footerTokens: row['footer_tokens'] as readonly DocumentToken[],
  marks: row['marks'] as readonly FormatMark[],
  shippedKey: (row['shipped_key'] as string | null) ?? undefined,
  createdAt: isoOf(row['created_at'] as Date),
  updatedAt: isoOf(row['updated_at'] as Date),
});

export const formatsRepo = (
  sql: Sql,
  accountId: string,
): DocumentFormatRepository => ({
  findById: async (id) => {
    if (!isUuid(id)) return null;
    const rows = await sql`
      select * from public.bison_formats
      where id = ${id} and account_id = ${accountId} limit 1
    `;
    return rows[0] ? formatFromRow(rows[0]) : null;
  },
  list: async () => {
    const rows = await sql`
      select * from public.bison_formats
      where account_id = ${accountId}
      order by created_at asc, id asc
    `;
    return rows.map(formatFromRow);
  },
  save: async (format) => {
    await sql`
      insert into public.bison_formats
        (id, account_id, name, theme_id, paper, header_tokens,
         footer_tokens, marks, shipped_key, created_at, updated_at)
      values
        (${format.id}, ${accountId}, ${format.name}, ${format.themeId},
         ${format.paper}, ${JSON.stringify(format.headerTokens)}::jsonb,
         ${JSON.stringify(format.footerTokens)}::jsonb,
         ${JSON.stringify(format.marks)}::jsonb,
         ${format.shippedKey ?? null}, ${format.createdAt},
         ${format.updatedAt})
      on conflict (id) do update set
        name = excluded.name,
        theme_id = excluded.theme_id,
        paper = excluded.paper,
        header_tokens = excluded.header_tokens,
        footer_tokens = excluded.footer_tokens,
        marks = excluded.marks,
        shipped_key = excluded.shipped_key,
        updated_at = excluded.updated_at
      where bison_formats.account_id = excluded.account_id
    `;
  },
});
