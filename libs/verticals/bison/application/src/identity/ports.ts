import type { BusinessIdentity } from '@acme/bison-domain';

/**
 * One identity record per account (the store is already account-scoped by
 * `forAccount`). `null` means the business has never saved anything — the
 * use case answers with the honest empty identity.
 */
export type BusinessIdentityRepository = {
  readonly get: () => Promise<BusinessIdentity | null>;
  readonly save: (identity: BusinessIdentity) => Promise<void>;
};
