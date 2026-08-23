import { type Clock, type Result, err, ok } from '@acme/shared';
import {
  EMPTY_BUSINESS_IDENTITY,
  updateBusinessIdentity,
} from '@acme/bison-domain';
import type {
  BusinessIdentity,
  BusinessIdentityChanges,
  BusinessIdentityError,
} from '@acme/bison-domain';
import type { BusinessIdentityRepository } from './ports';

export type IdentityUseCaseDeps = {
  readonly identity: BusinessIdentityRepository;
  readonly clock: Clock;
};

/** The identity as it stands — empty fields for whatever the business has
 *  not told us yet (never invented). */
export const makeGetIdentity =
  (deps: IdentityUseCaseDeps) => async (): Promise<BusinessIdentity> =>
    (await deps.identity.get()) ?? EMPTY_BUSINESS_IDENTITY;

export const makeUpdateIdentity =
  (deps: IdentityUseCaseDeps) =>
  async (input: {
    readonly changes: BusinessIdentityChanges;
  }): Promise<Result<BusinessIdentity, BusinessIdentityError>> => {
    const current = (await deps.identity.get()) ?? EMPTY_BUSINESS_IDENTITY;
    const updated = updateBusinessIdentity(
      current,
      input.changes,
      deps.clock.now().toISOString(),
    );
    if (!updated.ok) return err(updated.error);
    await deps.identity.save(updated.value);
    return ok(updated.value);
  };

export type IdentityUseCases = {
  readonly get: ReturnType<typeof makeGetIdentity>;
  readonly update: ReturnType<typeof makeUpdateIdentity>;
};

export const makeIdentityUseCases = (
  deps: IdentityUseCaseDeps,
): IdentityUseCases => ({
  get: makeGetIdentity(deps),
  update: makeUpdateIdentity(deps),
});
