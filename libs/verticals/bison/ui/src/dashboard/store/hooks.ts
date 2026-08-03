import { useMemo } from 'react';
import { useStore } from 'zustand';
import { useUseCases } from '../../di';
import { createDirectoryStore, type DirectoryStore } from './directory-store';
import { createPlansStore, type PlansStore } from './plans/plans-store';
import { createRolesStore, type RolesStore } from './roles/roles-store';
import {
  createTemplatesStore,
  type TemplatesStore,
} from './roles/templates-store';
import {
  createSettingsStore,
  type SettingsStore,
} from './settings/settings-store';
import { createAuditStore, type AuditStore } from './audit/audit-store';
import {
  createStaffDetailStore,
  type StaffDetailStore,
} from './permissions/staff-detail-store';
import {
  createAdminGateStore,
  type AdminGateStore,
} from './gate/admin-gate-store';

/**
 * React bindings for the dashboard stores: each builds its store from the DI
 * bundles (memoized on their stable identities) and is the ONLY place its
 * section ties React to the headless flow. Components subscribe with a selector
 * via `useStore`.
 *
 * Every bundle in `BisonUseCases` is required (ADR-0019), so a store is always
 * constructible. These used to return `Store | null` and re-check each bundle —
 * a branch that could never be taken once the composition root had run.
 */

/** Directory: the staff/customer table + its row actions. */
export const useDirectoryStore = (): DirectoryStore => {
  const { access, directory, invitations, coverage, block, accounts } =
    useUseCases();
  return useMemo(
    () =>
      createDirectoryStore({
        access,
        directory,
        invitations,
        billing: coverage,
        block,
        accounts,
      }),
    [access, directory, invitations, coverage, block, accounts],
  );
};

/** Plans: the `plans.manage` gate + the billing gateway. */
export const usePlansStore = (): PlansStore => {
  const { access, billing } = useUseCases();
  return useMemo(
    () => createPlansStore({ access, billing }),
    [access, billing],
  );
};

/** Roles: the access gate + the roles gateway. */
export const useRolesStore = (): RolesStore => {
  const { access, roles } = useUseCases();
  return useMemo(() => createRolesStore({ access, roles }), [access, roles]);
};

/** Templates: shares the same roles gateway. */
export const useTemplatesStore = (): TemplatesStore => {
  const { access, roles } = useUseCases();
  return useMemo(
    () => createTemplatesStore({ access, roles }),
    [access, roles],
  );
};

/** Settings: the access gate + the settings gateway. */
export const useSettingsStore = (): SettingsStore => {
  const { access, settings } = useUseCases();
  return useMemo(
    () => createSettingsStore({ access, settings }),
    [access, settings],
  );
};

/** One staff member's access detail (keyed by identity). */
export const useStaffDetailStore = (
  userId: string,
  accountId: string,
): StaffDetailStore => {
  const { access, members, roles, sessions } = useUseCases();
  return useMemo(
    () =>
      createStaffDetailStore(
        { access, members, roles, sessions },
        userId,
        accountId,
      ),
    [access, members, roles, sessions, userId, accountId],
  );
};

/** Audit: the access gate + the audit gateway. */
export const useAuditStore = (): AuditStore => {
  const { access, audit } = useUseCases();
  return useMemo(() => createAuditStore({ access, audit }), [access, audit]);
};

/** The staff route gate — resolved before any section renders. */
export const useAdminGateStore = (): AdminGateStore => {
  const { access } = useUseCases();
  return useMemo(() => createAdminGateStore({ access }), [access]);
};

export { useStore };
