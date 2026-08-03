import { useEffect } from 'react';
import { useOrgDetailStore, useStore } from './store/hooks';
import type { OrgDetailStore } from './store/org-detail-store';
import { OrgDetailView } from './org-detail.view';
import type { OrgDetailActions, OrgDetailVM } from './org-detail.types';

/**
 * The DI-bound org-detail container (ADR-0017 giro-owned). Reads the ViewModel
 * from the store and dispatches the backed actions: void/refund, the billing
 * levers (mark-paid / extend-trial / change-plan) and member block. `onBack`
 * comes from the parent (in-page master/detail, not a route). "View as customer"
 * (impersonation) is NOT a dashboard concern — it lives in the giro's customer
 * app under a support identity — so this screen offers no such affordance.
 */
const loadingVM = (accountId: string): OrgDetailVM => ({
  accountId,
  name: '',
  status: 'active',
  createdAt: '',
  canViewMembers: false,
  canManageMembers: false,
  canManageBilling: false,
  members: [],
  loading: true,
});

const buildActions = (
  store: OrgDetailStore,
  onBack: () => void,
): OrgDetailActions => ({
  onBack,
  onMarkPaid: () => void store.getState().openMarkPaid(),
  onExtendTrial: () => store.getState().openExtendTrial(),
  onChangePlan: () => void store.getState().openChangePlan(),
  onCloseBillingDialog: () => store.getState().closeDialog(),
  onSubmitChangePlan: (planId, reason) =>
    void store.getState().changePlan(planId, reason),
  onSubmitMarkPaid: (paidThrough, reason) =>
    void store.getState().markPaid(paidThrough, reason),
  onSubmitExtendTrial: (trialEndsAt, reason) =>
    void store.getState().extendTrial(trialEndsAt, reason),
  onViewMember: (membershipId) => store.getState().openMember(membershipId),
  onCloseMember: () => store.getState().closeMember(),
  onBlockMember: (membershipId, blocked) =>
    void store.getState().blockMember(membershipId, blocked),
  onVoidPayment: (entryId, reason) =>
    void store.getState().voidPayment(entryId, reason),
  onRefundPayment: (entryId, reason) =>
    void store.getState().refundPayment(entryId, reason),
});

const OrgDetailBound = ({
  store,
  accountId,
  onBack,
}: {
  readonly store: OrgDetailStore;
  readonly accountId: string;
  readonly onBack: () => void;
}) => {
  const vm = useStore(store, (s) => s.vm);
  useEffect(() => {
    void store.getState().load();
  }, [store]);
  return (
    <OrgDetailView
      vm={vm ?? loadingVM(accountId)}
      {...buildActions(store, onBack)}
    />
  );
};

export const OrgDetailSection = ({
  accountId,
  onBack,
}: {
  readonly accountId: string;
  readonly onBack: () => void;
}) => {
  const store = useOrgDetailStore(accountId);
  return <OrgDetailBound store={store} accountId={accountId} onBack={onBack} />;
};
