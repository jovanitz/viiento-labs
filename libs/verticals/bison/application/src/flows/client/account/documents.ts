import { type Result, err, ok } from '@acme/shared';
import type { DocumentToken } from '@acme/bison-domain';
import type { IssueDto } from '../../../documents/issuance-dto';
import type { BisonGatewayError } from '../../../client/gateway';
import type { BisonClientFlowDeps } from '../deps';

/**
 * The issuance controller (ADR-0020 §7), headless. Phase 1 lives on the
 * server (folio + frozen snapshot); rendering is the CALLER's half —
 * the ui owns the engine, fonts and measure — injected as a callback so
 * this orchestration stays framework-free and the conversational
 * interface can drive the same flow with a server-side renderer later.
 *
 * A failed render/upload leaves the issue PDF-less: the folio is consumed
 * and the gap auditable — never a collision, never a silent renumber.
 */
export type RenderIssuedPdf = (
  tokens: Readonly<Partial<Record<DocumentToken, string>>>,
) => Promise<Result<Uint8Array, BisonGatewayError>>;

export type IssuedPdf = {
  readonly issue: IssueDto;
  readonly bytes: Uint8Array;
};

export const issueEntryPdf = async (
  deps: BisonClientFlowDeps,
  input: {
    readonly entryId: string;
    readonly formatId: string;
    readonly render: RenderIssuedPdf;
  },
): Promise<Result<IssuedPdf, BisonGatewayError>> => {
  const issued = await deps.gateway.documents.issue({
    entryId: input.entryId,
    formatId: input.formatId,
  });
  if (!issued.ok) return issued;
  const bytes = await input.render(issued.value.tokens);
  if (!bytes.ok) return err(bytes.error);
  const attached = await deps.gateway.documents.attachPdf({
    issueId: issued.value.id,
    bytes: bytes.value,
  });
  if (!attached.ok) return attached;
  return ok({ issue: attached.value, bytes: bytes.value });
};

/** Query: one entry's issues, newest folio first. */
export const listEntryIssues = (
  deps: BisonClientFlowDeps,
  input: { readonly entryId: string },
): Promise<Result<ReadonlyArray<IssueDto>, BisonGatewayError>> =>
  deps.gateway.documents.issues(input);
