/**
 * Bison Manager · Dashboard · Customer (Org) Detail — a directory drill-down:
 * an org's relevant info, its owner, and its member roster.
 *
 * @screen Bison Manager / Dashboard / Org Detail
 * @phase approved
 *
 * Signed off and wired: the seam is `org-detail.container.tsx` (billing levers +
 * ledger void/refund + member block). Presentational still — a pure function of
 * (ViewModel + actions). The roster is an administrative read (`members.read` at
 * `any` scope — staff hold it); `canViewMembers` is a normal capability flag.
 * "View as customer" (impersonation) is NOT a dashboard concern — that lives in
 * the giro's customer app under a support identity.
 */
import type { ReactNode } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '../../../design-system/button/button';
import { Badge, type BadgeProps } from '../../../design-system/badge/badge';
import { DataTable } from '../../../design-system/data-table/data-table';
import { Skeleton } from '../../../design-system/skeleton/skeleton';
import { EmptyState } from '../../../design-system/empty/empty-state';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../../design-system/alert/alert';
import { memberColumns } from './org-detail.columns';
import { BillingDialogs } from './org-detail.billing-dialogs';
import { MemberSheet } from './org-detail.member-sheet';
import { BillingBlock } from './billing/billing-block';
import type {
  OrgDetailActions,
  OrgDetailVM,
  OrgStatus,
} from './org-detail.types';

const orgStatusVariant: Record<OrgStatus, BadgeProps['variant']> = {
  active: 'success',
  disabled: 'secondary',
  blocked: 'destructive',
};

const Stat = ({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) => (
  <div className="rounded-md border border-border p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="mt-1 text-sm font-medium text-foreground">{children}</div>
  </div>
);

const Header = ({ vm }: { readonly vm: OrgDetailVM }) => (
  <div>
    <div className="flex items-center gap-2">
      <h1 className="text-xl font-semibold text-foreground">{vm.name}</h1>
      <Badge variant={orgStatusVariant[vm.status]} appearance="soft" dot>
        {vm.status}
      </Badge>
    </div>
    <p className="text-sm text-muted-foreground">{vm.email ?? vm.accountId}</p>
  </div>
);

const Info = ({ vm }: { readonly vm: OrgDetailVM }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <Stat label="Members">{vm.members.length}</Stat>
    <Stat label="Owner">{vm.owner?.name ?? '—'}</Stat>
    <Stat label="Created">{vm.createdAt}</Stat>
    <Stat label="Account">
      <span className="font-mono text-xs">{vm.accountId}</span>
    </Stat>
  </div>
);

type MemberTableActions = Pick<
  OrgDetailActions,
  'onViewMember' | 'onBlockMember'
>;

const Members = ({
  vm,
  actions,
}: {
  readonly vm: OrgDetailVM;
  readonly actions: MemberTableActions;
}) => (
  <div className="flex flex-col gap-2">
    <h2 className="text-sm font-semibold text-foreground">Users</h2>
    {vm.canViewMembers ? (
      <DataTable
        columns={memberColumns({ canManage: vm.canManageMembers, ...actions })}
        data={vm.members}
        searchPlaceholder="Search members…"
        empty="This organization has no members."
      />
    ) : (
      <EmptyState
        icon={<Lock />}
        title="Members hidden"
        description="Your role can't read this organization's members."
      />
    )}
  </div>
);

export const OrgDetailView = ({
  vm,
  onBack,
  onMarkPaid,
  onExtendTrial,
  onChangePlan,
  onCloseBillingDialog,
  onSubmitChangePlan,
  onSubmitMarkPaid,
  onSubmitExtendTrial,
  onViewMember,
  onCloseMember,
  onBlockMember,
  onVoidPayment,
  onRefundPayment,
}: { readonly vm: OrgDetailVM } & OrgDetailActions) => {
  if (vm.loading) return <Skeleton className="h-96 w-full" />;
  if (vm.error)
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&rsquo;t load the organization</AlertTitle>
        <AlertDescription>{vm.error}</AlertDescription>
      </Alert>
    );
  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 w-fit text-muted-foreground"
      >
        <ArrowLeft /> Directory
      </Button>
      <Header vm={vm} />
      <Info vm={vm} />
      <BillingBlock
        vm={vm}
        onMarkPaid={onMarkPaid}
        onExtendTrial={onExtendTrial}
        onChangePlan={onChangePlan}
        onVoidPayment={onVoidPayment}
        onRefundPayment={onRefundPayment}
      />
      <Members vm={vm} actions={{ onViewMember, onBlockMember }} />
      {vm.billingDialog ? (
        <BillingDialogs
          dialog={vm.billingDialog}
          onCloseBillingDialog={onCloseBillingDialog}
          onSubmitChangePlan={onSubmitChangePlan}
          onSubmitMarkPaid={onSubmitMarkPaid}
          onSubmitExtendTrial={onSubmitExtendTrial}
        />
      ) : null}
      <MemberSheet
        member={vm.openMember}
        onCloseMember={onCloseMember}
        onBlockMember={onBlockMember}
      />
    </div>
  );
};
