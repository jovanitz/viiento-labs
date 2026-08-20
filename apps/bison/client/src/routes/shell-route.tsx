import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { EmptyState, Toaster } from '@acme/ui';
import { ClientShell, useClientUseCases } from '@acme/bison-ui';
import type { AccountMode, ClientSection } from '@acme/bison-ui';

/**
 * The app's chrome as a LAYOUT ROUTE: the shell's nav drives the router
 * (each section is a real URL — deep links and cross-section jumps work),
 * and child routes render into the outlet. Account mode stays local: the
 * organization view doesn't exist yet, so switching shows a placeholder
 * over whatever section is active.
 */
const SECTION_PATHS: Record<ClientSection, string> = {
  Agenda: '/agenda',
  Clients: '/clients',
  Templates: '/templates',
  Settings: '/settings',
};

const sectionOf = (pathname: string): ClientSection => {
  if (pathname.startsWith('/clients')) return 'Clients';
  if (pathname.startsWith('/templates')) return 'Templates';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'Agenda';
};

const OrgPlaceholder = () => (
  <EmptyState
    className="max-w-3xl"
    icon={<Building2 />}
    title="The organization view isn't designed yet"
    description="Switch back to the individual account to keep exploring."
  />
);

/** The signed-in identity for the topbar (email at minimum; display name
 *  when the provider has one). Behind the gate, so a session exists. */
const useShellUser = () => {
  const { access } = useClientUseCases();
  const [user, setUser] = useState<
    { name: string; email: string } | undefined
  >();
  useEffect(() => {
    let active = true;
    void access.getSession().then((session) => {
      if (!active || !session.ok) return;
      const { displayName, email } = session.value.user;
      setUser({
        name: displayName ?? email ?? 'Account',
        email: email ?? '',
      });
    });
    return () => {
      active = false;
    };
  }, [access]);
  return user;
};

const ShellRoute = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { access } = useClientUseCases();
  const [accountMode, setAccountMode] = useState<AccountMode>('individual');
  const user = useShellUser();

  return (
    <>
      <ClientShell
        active={sectionOf(pathname)}
        onNavigate={(section) => navigate(SECTION_PATHS[section])}
        accountMode={accountMode}
        onAccountModeChange={setAccountMode}
        user={user}
        onSignOut={() => void access.signOut()}
      >
        {accountMode === 'organization' ? <OrgPlaceholder /> : <Outlet />}
      </ClientShell>
      <Toaster />
    </>
  );
};

export default ShellRoute;
