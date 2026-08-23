import { type Result, ok } from '@acme/shared';
import type {
  BusinessIdentity,
  BusinessIdentityChanges,
  DocumentToken,
} from '@acme/bison-domain';
import type { BisonGatewayError } from '../../../client/gateway';
import type { BisonClientFlowDeps } from '../deps';

/**
 * The business-identity controller: what the account has on file, and the
 * `business.*` token values a document resolves at issue time
 * (ADR-0020 §4). An empty field yields NO token — the page prints nothing
 * rather than an invented letterhead.
 */
export const loadIdentity = (
  deps: BisonClientFlowDeps,
): Promise<Result<BusinessIdentity, BisonGatewayError>> =>
  deps.gateway.identity.get();

export const saveIdentity = (
  deps: BisonClientFlowDeps,
  input: { readonly changes: BusinessIdentityChanges },
): Promise<Result<BusinessIdentity, BisonGatewayError>> =>
  deps.gateway.identity.update(input);

/** Identity → token values, skipping whatever is empty. */
export const tokensOfIdentity = (
  identity: BusinessIdentity,
): Partial<Record<DocumentToken, string>> => {
  const pairs: ReadonlyArray<readonly [DocumentToken, string]> = [
    ['business.name', identity.name],
    ['business.address', identity.address],
    ['business.phone', identity.phone],
    ['business.license', identity.license],
  ];
  return Object.fromEntries(pairs.filter(([, value]) => value !== ''));
};

/** Query: the account's document tokens, ready for `composeModel`. */
export const loadAccountTokens = async (
  deps: BisonClientFlowDeps,
): Promise<
  Result<Partial<Record<DocumentToken, string>>, BisonGatewayError>
> => {
  const identity = await loadIdentity(deps);
  return identity.ok ? ok(tokensOfIdentity(identity.value)) : identity;
};
