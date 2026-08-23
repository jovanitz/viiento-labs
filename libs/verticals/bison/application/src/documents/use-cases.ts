import {
  type Clock,
  type IdGenerator,
  type Logger,
  type Result,
  type TaggedError,
  defineError,
  err,
  ok,
} from '@acme/shared';
import {
  createDocumentFormat,
  makeDocumentFormatId,
  updateDocumentFormat,
} from '@acme/bison-domain';
import type {
  DocumentFormat,
  DocumentToken,
  FormatDomainError,
  FormatMark,
  PaperKind,
} from '@acme/bison-domain';
import type { DocumentFormatRepository } from './ports';

export const formatNotFound = defineError('app/format-not-found');

export type FormatUseCaseError =
  | FormatDomainError
  | TaggedError<'app/format-not-found'>;

/** The format as the UI (and the RPC edge) sees it — brands erased. */
export type DocumentFormatDto = {
  readonly id: string;
  readonly name: string;
  readonly themeId: string;
  readonly paper: PaperKind;
  readonly headerTokens: readonly DocumentToken[];
  readonly footerTokens: readonly DocumentToken[];
  readonly marks: readonly FormatMark[];
  readonly shippedKey?: string | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
};

const toDto = (format: DocumentFormat): DocumentFormatDto => ({
  id: format.id,
  name: format.name,
  themeId: format.themeId,
  paper: format.paper,
  headerTokens: format.headerTokens,
  footerTokens: format.footerTokens,
  marks: format.marks,
  shippedKey: format.shippedKey,
  createdAt: format.createdAt,
  updatedAt: format.updatedAt,
});

export type FormatUseCaseDeps = {
  readonly formats: DocumentFormatRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly logger: Logger;
};

export type SaveFormatInput = {
  /** Set when editing an EXISTING backend row; a new one (or the first
   *  edit of a shipped starting point) arrives without it. */
  readonly existingId?: string | undefined;
  /** Provenance: the shipped format this row overrides, if any. */
  readonly shippedKey?: string | undefined;
  readonly name: string;
  readonly themeId: string;
  readonly paper: PaperKind;
  readonly headerTokens: readonly DocumentToken[];
  readonly footerTokens: readonly DocumentToken[];
  readonly marks: readonly FormatMark[];
};

/** Persist what the Formats editor produced — update when `existingId`
 *  names a backend row, create (with provenance) otherwise. */
export const makeSaveFormat =
  (deps: FormatUseCaseDeps) =>
  async (
    input: SaveFormatInput,
  ): Promise<Result<DocumentFormatDto, FormatUseCaseError>> => {
    const { existingId, shippedKey, ...format } = input;
    if (existingId === undefined) {
      const id = makeDocumentFormatId(deps.ids.next());
      if (!id.ok) return err(id.error);
      const created = createDocumentFormat({
        id: id.value,
        ...format,
        ...(shippedKey !== undefined ? { shippedKey } : {}),
        occurredAt: deps.clock.now().toISOString(),
      });
      if (!created.ok) return err(created.error);
      await deps.formats.save(created.value);
      deps.logger.info('bison.format.created', { formatId: created.value.id });
      return ok(toDto(created.value));
    }

    const id = makeDocumentFormatId(existingId);
    if (!id.ok) return err(id.error);
    const existing = await deps.formats.findById(id.value);
    if (!existing) {
      return err(formatNotFound(`No format with id ${existingId}.`));
    }
    const updated = updateDocumentFormat(
      existing,
      format,
      deps.clock.now().toISOString(),
    );
    if (!updated.ok) return err(updated.error);
    await deps.formats.save(updated.value);
    return ok(toDto(updated.value));
  };

export const makeListFormats =
  (deps: FormatUseCaseDeps) =>
  async (): Promise<ReadonlyArray<DocumentFormatDto>> => {
    const formats = await deps.formats.list();
    return formats.map(toDto);
  };

export type FormatUseCases = {
  readonly save: ReturnType<typeof makeSaveFormat>;
  readonly list: ReturnType<typeof makeListFormats>;
};

export const makeFormatUseCases = (
  deps: FormatUseCaseDeps,
): FormatUseCases => ({
  save: makeSaveFormat(deps),
  list: makeListFormats(deps),
});
