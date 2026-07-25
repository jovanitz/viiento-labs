import { type Clock, type Result, err, ok } from '@acme/shared';
import type { AccessActor, AccountId } from '@acme/domain';
import { authorizeAccessAction } from '../access/authorize';
import type { AccessUseCaseError } from '../access/errors';
import type {
  AccessAuditFilter,
  AccessAuditRecord,
  AccessAuditTrail,
  AuditLabelResolver,
} from './ports';
import {
  collectAuditRefs,
  projectAuditEvent,
  type AuditEntryView,
} from './projection';

export type AuditTrailDeps = {
  readonly trail: AccessAuditTrail;
  readonly clock: Clock;
};

/** Deps for the enriched read model: the trail plus the label resolver. */
export type AuditViewDeps = AuditTrailDeps & {
  readonly resolver: AuditLabelResolver;
};

type AuditReadInput = {
  readonly actor: AccessActor;
  readonly filter?: AccessAuditFilter;
};

// The audited slice IS the resource: filtering by an account lets `own` scope
// authorize an org admin on their account; the unfiltered (global) trail stays
// `any`-only.
const authorizeAuditRead = (
  clock: Clock,
  input: AuditReadInput,
): Result<unknown, AccessUseCaseError> =>
  authorizeAccessAction({
    actor: input.actor,
    action: 'audit.read',
    resource: {
      accountId: (input.filter?.accountId as AccountId | undefined) ?? null,
    },
    now: clock.now().toISOString(),
  });

export const makeListAuditEvents =
  (deps: AuditTrailDeps) =>
  async (
    input: AuditReadInput,
  ): Promise<Result<ReadonlyArray<AccessAuditRecord>, AccessUseCaseError>> => {
    const authorized = authorizeAuditRead(deps.clock, input);
    if (!authorized.ok) return err(authorized.error);
    return ok(await deps.trail.list(input.filter));
  };

/**
 * The read model the staff dashboard renders: same authorization as the raw
 * list, but each record is projected to a view row and its IDs resolved to
 * display labels (a server-side join the client never has to make).
 */
export const makeListAuditView =
  (deps: AuditViewDeps) =>
  async (
    input: AuditReadInput,
  ): Promise<Result<ReadonlyArray<AuditEntryView>, AccessUseCaseError>> => {
    const authorized = authorizeAuditRead(deps.clock, input);
    if (!authorized.ok) return err(authorized.error);
    // A reader authorized for the GLOBAL (null-account) trail holds `any` scope
    // and may see the whole graph; anyone else is `own`-scoped and only reached
    // their slice by filtering an account — so labels must resolve within THAT
    // account only, or a cross-account actor's email would leak (see ports.ts).
    const global = authorizeAuditRead(deps.clock, { actor: input.actor });
    const viewerAccountId = global.ok
      ? null
      : (input.filter?.accountId ?? null);
    const records = await deps.trail.list({
      ...input.filter,
      newestFirst: true,
    });
    const refs = collectAuditRefs(records);
    const labels = await deps.resolver.resolve(refs, viewerAccountId);
    return ok(records.map((record) => projectAuditEvent(record, labels)));
  };

/**
 * Records a failed login attempt. No actor and no policy check: this is fed
 * by the auth provider's webhook (signature-gated at the API edge), not by a
 * user request — the identity provider is the witness.
 */
export const makeRecordFailedLogin =
  (deps: AuditTrailDeps) =>
  async (input: { readonly identifier: string }): Promise<void> => {
    await deps.trail.append({
      type: 'login.failed',
      attemptedIdentifier: input.identifier,
      occurredAt: deps.clock.now().toISOString(),
    });
  };

export type AuditTrailUseCases = {
  readonly listAuditEvents: ReturnType<typeof makeListAuditEvents>;
  readonly listAuditView: ReturnType<typeof makeListAuditView>;
  readonly recordFailedLogin: ReturnType<typeof makeRecordFailedLogin>;
};

export const makeAuditTrailUseCases = (
  deps: AuditViewDeps,
): AuditTrailUseCases => ({
  listAuditEvents: makeListAuditEvents(deps),
  listAuditView: makeListAuditView(deps),
  recordFailedLogin: makeRecordFailedLogin(deps),
});
