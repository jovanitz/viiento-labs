import type {
  TemplateColor,
  TemplateIcon,
} from '@acme/bison-domain';
import type { VisitSummaryDto } from '../../agenda/dto';
import type { ClientDto } from '../../clients/dto';
import type { TemplateDto } from '../../templates/dto';
import type { EntryDto } from '../../timeline/dto';

/**
 * ViewModel shapes + pure builders for the Clients controller — split from
 * clients.ts so the command/query orchestration and the presentation
 * mapping each stay under the file-size cap. Labels are preformatted HERE,
 * never in components.
 */
export type ClientRowVM = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  /** Storage path of the photo on file — the UI resolves a signed URL. */
  readonly photoPath?: string | undefined;
  /** Resolved display URL; the flow leaves it empty (resolution is a read
   *  through `bison.files.url` the store performs). */
  readonly photoUrl?: string | undefined;
  readonly phone: string;
  readonly channels: ClientDto['channels'];
  /** Appointments aren't modeled yet, so visit facts render their empty
   *  fallbacks (0 / '') — honest placeholders, not invented history. */
  readonly visitCount: number;
  readonly latestVisitLabel: string;
};

export type ClientsVM = {
  readonly clients: ReadonlyArray<ClientRowVM>;
  readonly summary?: string | undefined;
  readonly empty: boolean;
};

export type TimelineEntryVM = {
  readonly id: string;
  readonly templateId: string;
  readonly templateName: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  /** ISO instant — the UI turns it into a Date at the edge. */
  readonly at: string;
  /** Preformatted — e.g. "9:30 AM". */
  readonly timeLabel: string;
  readonly summary: string;
  /** blockId rides along so consumers can match values back to the schema
   *  (positional matching breaks — the backend skips empty optionals). */
  readonly fields: ReadonlyArray<{
    readonly blockId: string;
    readonly label: string;
    readonly value: string;
  }>;
};

export type TimelineDayVM = {
  /** Preformatted — e.g. "Monday, August 3". */
  readonly dateLabel: string;
  /** Newest first. */
  readonly entries: ReadonlyArray<TimelineEntryVM>;
};

export type ClientDetailVM = {
  readonly client: ClientRowVM;
  /** Newest day first. */
  readonly days: ReadonlyArray<TimelineDayVM>;
  /** The template library, for the add-entry picker. */
  readonly templates: ReadonlyArray<TemplateDto>;
  readonly timelineEmpty: boolean;
};

/** e.g. "Mon, Aug 3" — noon-anchored so the label can't shear a day. */
export const shortDateLabel = (date: string): string =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

/** "Mon, Aug 3 · Classic cut" — bookings carry no service since 2026-08-11,
 *  so the label degrades to the date alone, never a dangling separator. */
export const visitLabel = (visit: VisitSummaryDto | undefined): string => {
  if (!visit) return '';
  const date = shortDateLabel(visit.latestDate);
  return visit.latestService ? `${date} · ${visit.latestService}` : date;
};

export const toRowVM = (client: ClientDto, visit?: VisitSummaryDto): ClientRowVM => ({
  id: client.id,
  name: client.name,
  initials: client.initials,
  photoPath: client.photoPath,
  phone: client.phone,
  channels: client.channels,
  visitCount: visit?.visitCount ?? 0,
  latestVisitLabel: visitLabel(visit),
});

export const timeLabel = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

export const dayLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

export const toEntryVM = (entry: EntryDto): TimelineEntryVM => ({
  id: entry.id,
  templateId: entry.templateId,
  templateName: entry.templateName,
  icon: entry.icon,
  color: entry.color,
  at: entry.at,
  timeLabel: timeLabel(entry.at),
  summary: entry.summary,
  fields: entry.fields,
});

/** Group newest-first entries into labeled days (order preserved). */
export const toDays = (
  entries: ReadonlyArray<EntryDto>,
): ReadonlyArray<TimelineDayVM> => {
  const days: { key: string; day: TimelineDayVM }[] = [];
  for (const entry of entries) {
    const key = new Date(entry.at).toDateString();
    const last = days[days.length - 1];
    const vm = toEntryVM(entry);
    if (last && last.key === key) {
      last.day = { ...last.day, entries: [...last.day.entries, vm] };
    } else {
      days.push({ key, day: { dateLabel: dayLabel(entry.at), entries: [vm] } });
    }
  }
  return days.map(({ day }) => day);
};

