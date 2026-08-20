import type { Row, Sql } from 'postgres';
import type { CalendarBlockRepository } from '@acme/bison-application';
import type {
  CalendarBlock,
  CalendarBlockDates,
  CalendarBlockId,
} from '@acme/bison-domain';
import { isUuid, isoOf } from './rows';

/**
 * Postgres `CalendarBlockRepository`. The dates variant maps to columns:
 * range → range_start/range_end (to_char'd back to YYYY-MM-DD strings),
 * recurring → weekdays int[] (null = daily).
 */
const datesOf = (row: Row): CalendarBlockDates =>
  row['kind'] === 'range'
    ? {
        kind: 'range',
        start: row['range_start'] as string,
        end: row['range_end'] as string,
      }
    : {
        kind: 'recurring',
        pattern:
          (row['weekdays'] as readonly number[] | null) === null
            ? 'daily'
            : (row['weekdays'] as readonly number[]),
      };

const blockFromRow = (row: Row): CalendarBlock => ({
  id: row['id'] as CalendarBlockId,
  label: row['label'] as string,
  allDay: row['all_day'] as boolean,
  startMin: row['start_min'] as number,
  endMin: row['end_min'] as number,
  dates: datesOf(row),
  createdAt: isoOf(row['created_at'] as Date),
});

const COLUMNS = `id, label, all_day, start_min, end_min, kind,
  to_char(range_start, 'YYYY-MM-DD') as range_start,
  to_char(range_end, 'YYYY-MM-DD') as range_end, weekdays, created_at`;

export const calendarBlocksRepo = (
  sql: Sql,
  accountId: string,
): CalendarBlockRepository => ({
  list: async () => {
    const rows = await sql.unsafe(
      `select ${COLUMNS} from public.bison_calendar_blocks
       where account_id = $1 order by created_at asc`,
      [accountId],
    );
    return rows.map(blockFromRow);
  },
  save: async (block) => {
    const range = block.dates.kind === 'range' ? block.dates : null;
    const weekdays =
      block.dates.kind === 'recurring' && block.dates.pattern !== 'daily'
        ? [...block.dates.pattern]
        : null;
    await sql`
      insert into public.bison_calendar_blocks
        (id, account_id, label, all_day, start_min, end_min, kind,
         range_start, range_end, weekdays, created_at)
      values
        (${block.id}, ${accountId}, ${block.label}, ${block.allDay},
         ${block.startMin}, ${block.endMin}, ${block.dates.kind},
         ${range?.start ?? null}, ${range?.end ?? null},
         ${weekdays}, ${block.createdAt})
      on conflict (id) do nothing
    `;
  },
  remove: async (id) => {
    if (!isUuid(id)) return;
    await sql`
      delete from public.bison_calendar_blocks
      where id = ${id} and account_id = ${accountId}
    `;
  },
});
