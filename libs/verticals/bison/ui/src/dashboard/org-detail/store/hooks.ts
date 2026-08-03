import { useMemo } from 'react';
import { useStore } from 'zustand';
import { useUseCases } from '../../../di';
import { createOrgDetailStore, type OrgDetailStore } from './org-detail-store';

/**
 * React binding for the org-detail store: builds it from the DI bundles
 * (memoized on their identities + the target accountId) — the ONLY place
 * org-detail ties React to the headless flow. Mirrors `dashboard/store/hooks.ts`
 * (the Directory binding); like it, the store is always constructible because
 * every bundle in `BisonUseCases` is required (ADR-0019).
 */
export const useOrgDetailStore = (accountId: string): OrgDetailStore => {
  const { access, orgDetail, billing, members } = useUseCases();
  return useMemo(
    () =>
      createOrgDetailStore(
        { access, orgs: orgDetail, billing, members },
        accountId,
      ),
    [access, orgDetail, billing, members, accountId],
  );
};

export { useStore };
