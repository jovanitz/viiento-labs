import type { Row, Sql } from 'postgres';
import type { BusinessIdentityRepository } from '@acme/bison-application';
import type { BusinessIdentity } from '@acme/bison-domain';
import { isoOf } from './rows';

/** Postgres `BusinessIdentityRepository` — one row per account, upserted
 *  whole (the record is tiny and the domain owns the merge). */
const identityFromRow = (row: Row): BusinessIdentity => ({
  name: row['name'] as string,
  address: row['address'] as string,
  phone: row['phone'] as string,
  license: row['license'] as string,
  logoPath: row['logo_path'] as string,
  updatedAt: isoOf(row['updated_at'] as Date),
});

export const identityRepo = (
  sql: Sql,
  accountId: string,
): BusinessIdentityRepository => ({
  get: async () => {
    const rows = await sql`
      select * from public.bison_identity
      where account_id = ${accountId} limit 1
    `;
    return rows[0] ? identityFromRow(rows[0]) : null;
  },
  save: async (identity) => {
    await sql`
      insert into public.bison_identity
        (account_id, name, address, phone, license, logo_path, updated_at)
      values
        (${accountId}, ${identity.name}, ${identity.address},
         ${identity.phone}, ${identity.license}, ${identity.logoPath},
         ${identity.updatedAt})
      on conflict (account_id) do update set
        name = excluded.name,
        address = excluded.address,
        phone = excluded.phone,
        license = excluded.license,
        logo_path = excluded.logo_path,
        updated_at = excluded.updated_at
    `;
  },
});
