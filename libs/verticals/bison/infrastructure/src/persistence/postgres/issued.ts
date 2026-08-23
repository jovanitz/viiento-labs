import type { Row, Sql } from 'postgres';
import type {
  FolioSource,
  IssuedDocumentRepository,
} from '@acme/bison-application';
import type {
  IssuedDocument,
  IssuedDocumentId,
  IssuedSnapshot,
} from '@acme/bison-domain';
import { isUuid, isoOf } from './rows';

/** Postgres issuance: the snapshot rides whole in jsonb (it is the point
 *  — self-contained forever); the folio counter allocates atomically. */
const issueFromRow = (row: Row): IssuedDocument => ({
  id: row['id'] as IssuedDocumentId,
  entryId: row['entry_id'] as string,
  clientId: row['client_id'] as string,
  folio: row['folio'] as number,
  issuedAt: isoOf(row['issued_at'] as Date),
  issuedBy: row['issued_by'] as string,
  status: row['status'] as IssuedDocument['status'],
  supersededBy: (row['superseded_by'] as string | null) ?? undefined,
  pdfPath: row['pdf_path'] as string,
  snapshot: row['snapshot'] as IssuedSnapshot,
});

export const issuedRepo = (
  sql: Sql,
  accountId: string,
): IssuedDocumentRepository => ({
  findById: async (id) => {
    if (!isUuid(id)) return null;
    const rows = await sql`
      select * from public.bison_issued_documents
      where id = ${id} and account_id = ${accountId} limit 1
    `;
    return rows[0] ? issueFromRow(rows[0]) : null;
  },
  listByEntry: async (entryId) => {
    if (!isUuid(entryId)) return [];
    const rows = await sql`
      select * from public.bison_issued_documents
      where entry_id = ${entryId} and account_id = ${accountId}
      order by folio desc
    `;
    return rows.map(issueFromRow);
  },
  save: async (issue) => {
    await sql`
      insert into public.bison_issued_documents
        (id, account_id, entry_id, client_id, folio, issued_at, issued_by,
         status, superseded_by, pdf_path, snapshot)
      values
        (${issue.id}, ${accountId}, ${issue.entryId}, ${issue.clientId},
         ${issue.folio}, ${issue.issuedAt}, ${issue.issuedBy},
         ${issue.status}, ${issue.supersededBy ?? null}, ${issue.pdfPath},
         ${JSON.stringify(issue.snapshot)}::jsonb)
      on conflict (id) do update set
        status = excluded.status,
        superseded_by = excluded.superseded_by,
        pdf_path = excluded.pdf_path
      where bison_issued_documents.account_id = excluded.account_id
    `;
  },
});

export const foliosSource = (sql: Sql, accountId: string): FolioSource => ({
  next: async () => {
    const rows = await sql`
      insert into public.bison_folio_counters (account_id, next)
      values (${accountId}, 2)
      on conflict (account_id)
        do update set next = bison_folio_counters.next + 1
      returning next - 1 as folio
    `;
    return (rows[0] as Row)['folio'] as number;
  },
});
