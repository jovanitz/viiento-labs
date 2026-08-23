import { type Clock, type IdGenerator, type Result, err, ok } from '@acme/shared';
import type { FileStorage } from '@acme/application';
import {
  attachIssuedPdf,
  createIssuedDocument,
  folioLabel,
  makeClientId,
  voidIssuedDocument,
} from '@acme/bison-domain';
import type {
  DocumentFormatId,
  DocumentToken,
  IssuedDocumentId,
  IssuedSnapshot,
} from '@acme/bison-domain';
import {
  definedTokens,
  issueDateLabel,
  issueNotFound,
  issueTargetNotFound,
  toIssueDto,
} from './issuance-dto';
import type { IssuanceError, IssueDto } from './issuance-dto';
import type { ClientRepository } from '../clients/ports';
import type { EntryRepository } from '../timeline/ports';
import type { TemplateRepository } from '../templates/ports';
import type { BusinessIdentityRepository } from '../identity/ports';
import type {
  DocumentFormatRepository,
  FolioSource,
  IssuedDocumentRepository,
} from './ports';

export type IssuanceDeps = {
  readonly issued: IssuedDocumentRepository;
  readonly folios: FolioSource;
  readonly entries: EntryRepository;
  readonly templates: TemplateRepository;
  readonly formats: DocumentFormatRepository;
  readonly clients: ClientRepository;
  readonly identity: BusinessIdentityRepository;
  readonly files: FileStorage;
  readonly clock: Clock;
  readonly ids: IdGenerator;
};

/** The account's identity + the client's name, as tokens, merged over
 *  the issue-time base (folio, date). Empty fields yield no token. */
const resolveIssueTokens = async (
  deps: IssuanceDeps,
  rawClientId: string,
  base: Partial<Record<DocumentToken, string>>,
): Promise<Partial<Record<DocumentToken, string>>> => {
  const clientId = makeClientId(rawClientId);
  const client = clientId.ok
    ? await deps.clients.findById(clientId.value)
    : null;
  const identity = await deps.identity.get();
  return {
    ...definedTokens([
      ['business.name', identity?.name],
      ['business.address', identity?.address],
      ['business.phone', identity?.phone],
      ['business.license', identity?.license],
      ['client.name', client?.name],
    ]),
    ...base,
  };
};

/**
 * Phase 1 of issuing (ADR-0020 §7): allocate the folio, freeze the
 * snapshot (blocks, values, format, resolved tokens) and persist the
 * issue. The caller renders the PDF from the returned tokens and attaches
 * the bytes in phase 2 — if that upload never lands, the folio stays
 * consumed and the gap is auditable.
 */
export const makeIssueDocument =
  (deps: IssuanceDeps) =>
  async (input: {
    readonly entryId: string;
    readonly formatId: string;
    readonly issuedBy: string;
  }): Promise<Result<IssueDto, IssuanceError>> => {
    const entry = await deps.entries.findById(input.entryId);
    if (!entry) {
      return err(issueTargetNotFound(`No entry with id ${input.entryId}.`));
    }
    const format = await deps.formats.findById(
      input.formatId as DocumentFormatId,
    );
    if (!format) {
      return err(issueTargetNotFound(`No format with id ${input.formatId}.`));
    }
    const folio = await deps.folios.next();
    const issuedAt = deps.clock.now().toISOString();
    const tokens = await resolveIssueTokens(deps, entry.clientId, {
      'document.folio': folioLabel(folio),
      'document.issuedAt': issueDateLabel(issuedAt),
    });
    const template = await deps.templates.findById(entry.templateId);
    const snapshot: IssuedSnapshot = {
      templateName: entry.templateName,
      blocks: template?.blocks ?? [],
      values: Object.fromEntries(
        entry.fields.map((field) => [field.blockId, field.value]),
      ),
      format,
      tokens,
    };
    const created = createIssuedDocument({
      id: deps.ids.next() as IssuedDocumentId,
      entryId: entry.id,
      clientId: entry.clientId,
      folio,
      issuedAt,
      issuedBy: input.issuedBy,
      snapshot,
    });
    if (!created.ok) return err(created.error);
    await deps.issued.save(created.value);
    return ok(toIssueDto(created.value));
  };

/** Phase 2: the rendered bytes land in storage under the issue's own
 *  opaque path, exactly once. */
export const makeAttachIssuedPdf =
  (deps: IssuanceDeps) =>
  async (input: {
    readonly issueId: string;
    readonly bytes: Uint8Array;
  }): Promise<Result<IssueDto, IssuanceError>> => {
    const issue = await deps.issued.findById(input.issueId as IssuedDocumentId);
    if (!issue) {
      return err(issueNotFound(`No issue with id ${input.issueId}.`));
    }
    const path = `issued/${issue.id}`;
    const attached = attachIssuedPdf(issue, path);
    if (!attached.ok) return err(attached.error);
    const stored = await deps.files.put({
      path,
      bytes: input.bytes,
      mime: 'application/pdf',
    });
    if (!stored.ok) return err(stored.error);
    await deps.issued.save(attached.value);
    return ok(toIssueDto(attached.value));
  };

export const makeVoidIssue =
  (deps: IssuanceDeps) =>
  async (input: {
    readonly issueId: string;
    readonly supersededBy?: string;
  }): Promise<Result<IssueDto, IssuanceError>> => {
    const issue = await deps.issued.findById(input.issueId as IssuedDocumentId);
    if (!issue) {
      return err(issueNotFound(`No issue with id ${input.issueId}.`));
    }
    const voided = voidIssuedDocument(issue, input.supersededBy);
    if (!voided.ok) return err(voided.error);
    await deps.issued.save(voided.value);
    return ok(toIssueDto(voided.value));
  };

export const makeListIssues =
  (deps: IssuanceDeps) =>
  async (input: {
    readonly entryId: string;
  }): Promise<ReadonlyArray<IssueDto>> =>
    (await deps.issued.listByEntry(input.entryId)).map(toIssueDto);

export type IssuanceUseCases = {
  readonly issue: ReturnType<typeof makeIssueDocument>;
  readonly attachPdf: ReturnType<typeof makeAttachIssuedPdf>;
  readonly voidIssue: ReturnType<typeof makeVoidIssue>;
  readonly list: ReturnType<typeof makeListIssues>;
};

export const makeIssuanceUseCases = (deps: IssuanceDeps): IssuanceUseCases => ({
  issue: makeIssueDocument(deps),
  attachPdf: makeAttachIssuedPdf(deps),
  voidIssue: makeVoidIssue(deps),
  list: makeListIssues(deps),
});
