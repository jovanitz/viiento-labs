import type { ReactNode } from 'react';
import {
  CalendarDays,
  CalendarRange,
  LayoutTemplate,
  Settings,
  Users,
} from 'lucide-react';
import {
  AppShell,
  BottomNavItem,
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
import {
  AccountSwitcher,
  type AccountMode,
} from './client.shell.account-switcher';
import { initialsOf } from './clients/clients.logic';

/**
 * Shared client-app page frame for the Bison Manager stories — the app the
 * business (a barbershop, a clinic…) uses day to day, as opposed to the
 * operator dashboard. Same AppShell chrome (sidebar + topbar + bottom nav) so
 * each section renders as it will look in the real product. Story-only: the
 * app composes shell + view via the route; the `.view.tsx` files stay
 * presentational (content-only).
 */
export type ClientSection = 'Agenda' | 'Clients' | 'Templates' | 'Settings';

export type { AccountMode };

const NAV: ReadonlyArray<{
  readonly label: ClientSection;
  readonly icon: typeof Users;
}> = [
  { label: 'Agenda', icon: CalendarDays },
  { label: 'Clients', icon: Users },
  { label: 'Templates', icon: LayoutTemplate },
  { label: 'Settings', icon: Settings },
];

const MobileNav = ({
  active,
  onNavigate,
}: {
  readonly active: ClientSection;
  readonly onNavigate?: ((section: ClientSection) => void) | undefined;
}) => (
  <>
    {NAV.map(({ label, icon: Icon }) => (
      <BottomNavItem
        key={label}
        icon={<Icon />}
        active={label === active}
        onClick={() => onNavigate?.(label)}
      >
        {label}
      </BottomNavItem>
    ))}
  </>
);

// The fixture business. One org, owned — so "Create" is not offered (you may
// own at most one org, same UI rule as the dashboard shell).
const ORGS: readonly Org[] = [
  {
    id: 'northfade',
    name: 'North Fade Barbershop',
    fallback: 'NF',
    owner: true,
  },
];

const Nav = ({
  active,
  onNavigate,
}: {
  readonly active: ClientSection;
  readonly onNavigate?: ((section: ClientSection) => void) | undefined;
}) => {
  const { railed } = useSidebar();
  return (
    <>
      <SidebarHeader>
        {!railed && (
          <>
            <CalendarRange className="size-5 shrink-0 text-primary" />
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

/** What the topbar shows about who's signed in. Kept as a prop so the
 *  prototype's editable profile (Settings) is the same identity the
 *  UserMenu displays. */
export type ShellOwner = {
  readonly name: string;
  readonly email: string;
  readonly photoUrl: string;
};

const DEFAULT_OWNER: ShellOwner = {
  name: 'Marco Vega',
  email: 'marco@northfade.mx',
  photoUrl: '',
};

const Head = ({
  accountMode,
  onAccountModeChange,
  owner,
}: {
  readonly accountMode: AccountMode;
  readonly onAccountModeChange?: ((mode: AccountMode) => void) | undefined;
  readonly owner: ShellOwner;
}) => (
  <>
    <AccountSwitcher
      mode={accountMode}
      onModeChange={onAccountModeChange}
      org={ORGS[0]}
      owner={{
        name: owner.name,
        fallback: initialsOf(owner.name) || '?',
      }}
    />
    <TopbarActions>
      <UserMenu
        name={owner.name}
        email={owner.email}
        avatarSrc={owner.photoUrl || undefined}
        onSignOut={() => undefined}
      />
    </TopbarActions>
  </>
);

export const ClientShell = ({
  active,
  onNavigate,
  accountMode = 'individual',
  onAccountModeChange,
  owner = DEFAULT_OWNER,
  children,
}: {
  readonly active: ClientSection;
  readonly onNavigate?: (section: ClientSection) => void;
  /** Defaults to individual — the account owner's own calendar. */
  readonly accountMode?: AccountMode;
  readonly onAccountModeChange?: (mode: AccountMode) => void;
  /** Topbar identity; defaults to the fixture owner. */
  readonly owner?: ShellOwner;
  readonly children: ReactNode;
}) => (
  <AppShell
    sidebar={<Nav active={active} onNavigate={onNavigate} />}
    topbar={
      <Head
        accountMode={accountMode}
        onAccountModeChange={onAccountModeChange}
        owner={owner}
      />
    }
    bottomNav={<MobileNav active={active} onNavigate={onNavigate} />}
  >
    {children}
  </AppShell>
);
