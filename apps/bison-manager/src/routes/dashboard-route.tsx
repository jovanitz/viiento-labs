import { useState } from 'react';
import {
  DashboardShell,
  DirectorySection,
  OrgDetailSection,
  PlansSection,
  RolesSection,
  TemplatesSection,
  SettingsSection,
  AuditSection,
  StaffDetailSection,
  RequireAdmin,
  type DashboardSection,
} from '@acme/ui';

/**
 * The protected bison-manager dashboard, in its own module so the router can
 * `lazy`-load it as a separate chunk. `RequireAdmin` shows the login gate until
 * an authorized staff member is present, then renders the shell. The shell owns
 * section navigation; every entry is a wired section. Directory drills down
 * IN-PAGE (master/detail, not a route) to the org-detail or a staff member's
 * access detail when a row is opened.
 */

type StaffTarget = { readonly userId: string; readonly accountId: string };

const DirectoryPane = ({
  onOpenOrg,
  onOpenStaff,
}: {
  readonly onOpenOrg: (accountId: string) => void;
  readonly onOpenStaff: (staff: StaffTarget) => void;
}) => <DirectorySection onOpenOrg={onOpenOrg} onOpenStaff={onOpenStaff} />;

const BisonManagerDashboard = () => {
  const [active, setActive] = useState<DashboardSection>('Directory');
  const [openOrgId, setOpenOrgId] = useState<string | null>(null);
  const [openStaff, setOpenStaff] = useState<StaffTarget | null>(null);
  const navigate = (section: DashboardSection) => {
    setOpenOrgId(null);
    setOpenStaff(null);
    setActive(section);
  };
  // Directory drills down in-page to an org OR a staff member (by identity).
  const directory = () => {
    if (openOrgId !== null)
      return (
        <OrgDetailSection
          accountId={openOrgId}
          onBack={() => setOpenOrgId(null)}
        />
      );
    if (openStaff !== null)
      return (
        <StaffDetailSection
          userId={openStaff.userId}
          accountId={openStaff.accountId}
          onBack={() => setOpenStaff(null)}
        />
      );
    return (
      <DirectoryPane onOpenOrg={setOpenOrgId} onOpenStaff={setOpenStaff} />
    );
  };
  // Every nav entry is its own wired section now. A function (not a nested
  // ternary) keeps the lint happy; Audit is the last, so it is the default.
  const content = () => {
    if (active === 'Directory') return directory();
    if (active === 'Plans') return <PlansSection />;
    if (active === 'Roles') return <RolesSection />;
    if (active === 'Templates') return <TemplatesSection />;
    if (active === 'Settings') return <SettingsSection />;
    return <AuditSection />;
  };
  return (
    <DashboardShell active={active} onNavigate={navigate}>
      {content()}
    </DashboardShell>
  );
};

const DashboardRoute = () => (
  <RequireAdmin>
    <BisonManagerDashboard />
  </RequireAdmin>
);

export default DashboardRoute;
