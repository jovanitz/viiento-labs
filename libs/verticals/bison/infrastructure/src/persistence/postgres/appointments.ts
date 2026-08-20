import type { Sql } from 'postgres';
import type { Row } from 'postgres';
import type {
  AppointmentRepository,
  VisitSummary,
} from '@acme/bison-application';
import type {
  Appointment,
  AppointmentId,
  AppointmentStatus,
  ClientId,
} from '@acme/bison-domain';
import { isUuid, isoOf } from './rows';

/**
 * Postgres `AppointmentRepository` — same contract as the in-memory
 * adapter. `date` is selected via to_char so the domain's YYYY-MM-DD
 * string never round-trips through a timezone-bearing Date.
 */
const appointmentFromRow = (row: Row): Appointment => ({
  id: row['id'] as AppointmentId,
  clientId: row['client_id'] as ClientId,
  clientName: row['client_name'] as string,
  service: row['service'] as string,
  staffName: row['staff_name'] as string,
  date: row['date'] as string,
  startMin: row['start_min'] as number,
  durationMinutes: row['duration_minutes'] as number,
  status: row['status'] as AppointmentStatus,
  note: (row['note'] as string | null) ?? undefined,
  createdAt: isoOf(row['created_at'] as Date),
  updatedAt: isoOf(row['updated_at'] as Date),
});

const COLUMNS = `id, client_id, client_name, service, staff_name,
  to_char(date, 'YYYY-MM-DD') as date, start_min, duration_minutes, status,
  note, created_at, updated_at`;

const saveAppointment = async (
  sql: Sql,
  accountId: string,
  appointment: Appointment,
): Promise<void> => {
  await sql`
    insert into public.bison_appointments
      (id, account_id, client_id, client_name, service, staff_name,
       date, start_min, duration_minutes, status, note,
       created_at, updated_at)
    values
      (${appointment.id}, ${accountId}, ${appointment.clientId},
       ${appointment.clientName}, ${appointment.service},
       ${appointment.staffName}, ${appointment.date},
       ${appointment.startMin}, ${appointment.durationMinutes},
       ${appointment.status}, ${appointment.note ?? null},
       ${appointment.createdAt}, ${appointment.updatedAt})
    on conflict (id) do update set
      client_id = excluded.client_id,
      client_name = excluded.client_name,
      service = excluded.service,
      staff_name = excluded.staff_name,
      date = excluded.date,
      start_min = excluded.start_min,
      duration_minutes = excluded.duration_minutes,
      status = excluded.status,
      note = excluded.note,
      updated_at = excluded.updated_at
    where bison_appointments.account_id = excluded.account_id
  `;
};

export const appointmentsRepo = (
  sql: Sql,
  accountId: string,
): AppointmentRepository => ({
  findById: async (id) => {
    if (!isUuid(id)) return null;
    const rows = await sql.unsafe(
      `select ${COLUMNS} from public.bison_appointments
       where id = $1 and account_id = $2 limit 1`,
      [id, accountId],
    );
    return rows[0] ? appointmentFromRow(rows[0]) : null;
  },
  listByDay: async (date) => {
    const rows = await sql.unsafe(
      `select ${COLUMNS} from public.bison_appointments
       where account_id = $1 and date = $2
       order by start_min asc, id asc`,
      [accountId, date],
    );
    return rows.map(appointmentFromRow);
  },
  save: (appointment) => saveAppointment(sql, accountId, appointment),
  visitSummaries: async () => {
    const rows = await sql`
      select client_id,
             count(*)::int as visit_count,
             (array_agg(to_char(date, 'YYYY-MM-DD')
                order by date desc, start_min desc))[1] as latest_date,
             (array_agg(service
                order by date desc, start_min desc))[1] as latest_service
      from public.bison_appointments
      where account_id = ${accountId} and status = 'confirmed'
      group by client_id
    `;
    return rows.map(
      (row): VisitSummary => ({
        clientId: row['client_id'] as ClientId,
        visitCount: row['visit_count'] as number,
        latestDate: row['latest_date'] as string,
        latestService: row['latest_service'] as string,
      }),
    );
  },
});
