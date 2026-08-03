import type { ReactNode } from 'react';
import {
  CreditCard,
  LayoutDashboard,
  LayoutTemplate,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  AppShell,
  BottomNavItem,
  OrgSwitcher,
  SidebarContent,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
  SidebarTrigger,
  TopbarActions,
  UserMenu,
  type Org,
  useSidebar,
} from '@acme/ui';

/**
 * Shared dashboard page frame for the Bison Manager stories — the design
 * system's AppShell (sidebar + topbar) so each section renders as it will look
 * in the real product. Story-only: the app composes shell + view via the route;
 * the `.view.tsx` files stay presentational (content-only).
 */
export type DashboardSection =
  | 'Directory'
  | 'Roles'
  | 'Templates'
  | 'Plans'
  | 'Audit'
  | 'Settings';

const NAV: ReadonlyArray<{
  readonly label: DashboardSection;
  readonly icon: typeof Users;
}> = [
  { label: 'Directory', icon: Users },
  { label: 'Roles', icon: ShieldCheck },
  { label: 'Templates', icon: LayoutTemplate },
  { label: 'Plans', icon: CreditCard },
  { label: 'Audit', icon: ScrollText },
  { label: 'Settings', icon: Settings },
];

// The 3-4 thumb-reachable destinations for the mobile/tablet bottom bar; the
// AppShell appends a "More" entry that opens the full nav as a bottom sheet.
const BOTTOM: readonly DashboardSection[] = [
  'Directory',
  'Roles',
  'Plans',
  'Audit',
];

const MobileNav = ({
  active,
  onNavigate,
}: {
  readonly active: DashboardSection;
  readonly onNavigate?: ((section: DashboardSection) => void) | undefined;
}) => (
  <>
    {NAV.filter(({ label }) => BOTTOM.includes(label)).map(
      ({ label, icon: Icon }) => (
        <BottomNavItem
          key={label}
          icon={<Icon />}
          active={label === active}
          onClick={() => onNavigate?.(label)}
        >
          {label}
        </BottomNavItem>
      ),
    )}
  </>
);

const ORGS: readonly Org[] = [
  { id: 'acme', name: 'Acme Health', fallback: 'AH', owner: true },
  { id: 'globex', name: 'Globex Clinics', fallback: 'GC', caption: 'Admin' },
];

// Business rule (UI): you may own at most one org — offer "Create" only when you
// don't already own one.
const canCreateOrg = !ORGS.some((o) => o.owner);

const Nav = ({
  active,
  onNavigate,
}: {
  readonly active: DashboardSection;
  readonly onNavigate?: ((section: DashboardSection) => void) | undefined;
}) => {
  const { railed } = useSidebar();
  return (
    <>
      <SidebarHeader>
        {!railed && (
          <>
            <LayoutDashboard className="size-5 shrink-0 text-primary" />
            <span className="flex-1 truncate">Bison Manager</span>
          </>
        )}
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav>
          {NAV.map(({ label, icon: Icon }) => (
            <SidebarNavItem
              key={label}
              icon={<Icon />}
              active={label === active}
              onClick={() => onNavigate?.(label)}
            >
              {label}
            </SidebarNavItem>
          ))}
        </SidebarNav>
      </SidebarContent>
    </>
  );
};

const Head = () => (
  <>
    <OrgSwitcher
      current={ORGS[0]}
      orgs={ORGS}
      onCreate={() => undefined}
      canCreate={canCreateOrg}
    />
    <TopbarActions>
      <UserMenu
        name="Josh Torres"
        email="josh@acme.com"
        onSignOut={() => undefined}
      />
    </TopbarActions>
  </>
);

export const DashboardShell = ({
  active,
  onNavigate,
  children,
}: {
  readonly active: DashboardSection;
  readonly onNavigate?: (section: DashboardSection) => void;
  readonly children: ReactNode;
}) => (
  <AppShell
    sidebar={<Nav active={active} onNavigate={onNavigate} />}
    topbar={<Head />}
    bottomNav={<MobileNav active={active} onNavigate={onNavigate} />}
  >
    {children}
  </AppShell>
);
