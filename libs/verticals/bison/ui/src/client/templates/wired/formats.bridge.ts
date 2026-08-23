import type {
  DocumentFormatDto,
  SaveFormatInput,
} from '@acme/bison-application';
import {
  SHIPPED_FORMATS,
  type DocumentFormat,
} from '../document/document.format';
import type { MarkVM } from '../document/document.types';

/**
 * The shipped↔backend bridge for formats (ADR-0021): shipped starting
 * points live in the app; the backend holds the business's rows. The
 * catalog the UI shows is shipped order with each entry REPLACED by its
 * copy-on-write override (matched by shippedKey), then the business's own
 * customs in creation order.
 */
const toUiMark = (mark: DocumentFormatDto['marks'][number]): MarkVM => ({
  id: mark.id,
  asset: mark.asset,
  region: mark.region,
  corner: mark.corner,
  ...(mark.caption !== undefined ? { caption: mark.caption } : {}),
});

const toUiFormat = (dto: DocumentFormatDto): DocumentFormat => ({
  id: dto.id,
  name: dto.name,
  themeId: dto.themeId,
  paper: dto.paper,
  headerTokens: dto.headerTokens,
  footerTokens: dto.footerTokens,
  marks: dto.marks.map(toUiMark),
});

export const mergeFormats = (
  stored: ReadonlyArray<DocumentFormatDto>,
): readonly DocumentFormat[] => {
  const overrides = new Map(
    stored.filter((f) => f.shippedKey).map((f) => [f.shippedKey, f]),
  );
  const shipped = SHIPPED_FORMATS.map((format) => {
    const override = overrides.get(format.id);
    return override ? toUiFormat(override) : format;
  });
  const customs = stored
    .filter((f) => !f.shippedKey)
    .map((format) => toUiFormat(format));
  return [...shipped, ...customs];
};

/** What saving an edited catalog entry means: update the backend row it
 *  already is, or create one — carrying shipped provenance when the entry
 *  being edited IS a shipped starting point. */
export const saveInputOf = (
  format: DocumentFormat,
  stored: ReadonlyArray<DocumentFormatDto>,
): SaveFormatInput => {
  const backedIds = new Set(stored.map((f) => f.id));
  const shippedIds = new Set(SHIPPED_FORMATS.map((f) => f.id));
  return {
    ...(backedIds.has(format.id) ? { existingId: format.id } : {}),
    ...(shippedIds.has(format.id) ? { shippedKey: format.id } : {}),
    name: format.name,
    themeId: format.themeId,
    paper: format.paper,
    headerTokens: format.headerTokens,
    footerTokens: format.footerTokens,
    marks: format.marks,
  };
};
