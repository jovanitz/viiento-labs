import { err, ok } from '@acme/shared';
import type { Result } from '@acme/shared';
import { paginateDocument } from '@acme/application';
import {
  bisonGatewayError,
  issueEntryPdf,
  saveFormat,
} from '@acme/bison-application';
import type {
  BisonGatewayError,
  DocumentFormatDto,
} from '@acme/bison-application';
import { useClientUseCases } from '../../di';
import { composeModel } from '../../templates/document/document.compose';
import type { EntryValues } from '../../templates/document/document.compose';
import { canvasTextMeasure } from '../../templates/document/render/document.measure';
import type { DocumentFormat } from '../../templates/document/document.format';
import type { TokenValues } from '../../templates/document/document.tokens';
import { saveInputOf } from '../../templates/wired/formats.bridge';
import type { EntryTemplate } from '../../templates/templates.types';

/**
 * The wired half of issuing (ADR-0020 §7): ensure the chosen format has a
 * backend row (picking a SHIPPED starting point copy-on-writes it, same
 * as editing one), run the issuance flow — server folio + snapshot, THIS
 * side renders the PDF with the returned tokens — then hand the user the
 * file. Returns the folio label, or null on failure.
 */
export type IssueTarget = {
  readonly entryId: string;
  readonly template: EntryTemplate;
  readonly values: EntryValues;
};

const downloadPdf = (bytes: Uint8Array, fileName: string): void => {
  const blob = new Blob([bytes as unknown as BlobPart], {
    type: 'application/pdf',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const ensurePersistedFormat = async (
  deps: { readonly gateway: Parameters<typeof saveFormat>[0]['gateway'] },
  format: DocumentFormat,
  stored: ReadonlyArray<DocumentFormatDto> | null,
): Promise<Result<string, BisonGatewayError>> => {
  if (stored?.some((row) => row.id === format.id)) return ok(format.id);
  const saved = await saveFormat(deps, saveInputOf(format, stored ?? []));
  return saved.ok ? ok(saved.value.id) : saved;
};

export const useIssueEntry = (
  target: IssueTarget | undefined,
  storedFormats: ReadonlyArray<DocumentFormatDto> | null,
):
  | ((format: DocumentFormat, fileName: string) => Promise<string | null>)
  | undefined => {
  const { gateway, documents } = useClientUseCases();
  if (!target) return undefined;
  return async (format, fileName) => {
    const formatId = await ensurePersistedFormat(
      { gateway },
      format,
      storedFormats,
    );
    if (!formatId.ok) return null;
    const result = await issueEntryPdf(
      { gateway },
      {
        entryId: target.entryId,
        formatId: formatId.value,
        render: async (tokens) => {
          const doc = paginateDocument(
            composeModel({
              format,
              template: target.template,
              values: target.values,
              tokens: tokens as TokenValues,
            }),
            canvasTextMeasure,
          );
          const rendered = await documents.renderer.toPdf(doc);
          return rendered.ok
            ? rendered
            : err(bisonGatewayError(rendered.error.message));
        },
      },
    );
    if (!result.ok) return null;
    downloadPdf(result.value.bytes, fileName);
    return result.value.issue.folioLabel;
  };
};
