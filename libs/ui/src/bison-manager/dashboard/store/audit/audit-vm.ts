import type { AuditRecordDto } from '@acme/application';
import type { AuditRow } from '../../audit/audit.types';

/**
 * Maps a server-enriched audit row onto the view's `AuditRow`. The heavy work
 * (category, actor/target resolution) already happened server-side, so this is
 * a thin shape adapter — it only formats the timestamp for display (UTC, stable
 * across locales) and drops null actor/target so optional fields stay absent.
 */
const formatWhen = (iso: string): string =>
  iso.includes('T') ? `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC` : iso;

export const toAuditRow = (dto: AuditRecordDto): AuditRow => ({
  id: dto.id,
  type: dto.type,
  category: dto.category,
  occurredAt: formatWhen(dto.occurredAt),
  ...(dto.actor ? { actor: dto.actor } : {}),
  ...(dto.target
    ? {
        target: {
          label: dto.target.label,
          kind: dto.target.kind,
          id: dto.target.id,
        },
      }
    : {}),
});
