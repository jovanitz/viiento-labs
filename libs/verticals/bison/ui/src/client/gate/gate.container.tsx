import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { CircleUserRound } from 'lucide-react';
import { Button, EmptyState } from '@acme/ui';
import { GateView } from '../../dashboard/gate/gate.view';
import { LoginView } from '../../dashboard/login/login.view';
import { useClientUseCases } from '../di';
import { useClientGateStore, useStore } from '../store/hooks';

/**
 * The client app's session gate — the business owner's door. The four-way
 * decision (anonymous / no-org / blocked / authenticated) stays in the
 * shared `resolveClientGate` controller, reached through the gate store;
 * this is only the reactive shell that re-resolves on auth changes and
 * maps each state to a view. The login/gate VIEWS are the dashboard's
 * approved ones, reused with the client app's copy.
 */
const ClientLoginSection = () => {
  const { access } = useClientUseCases();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    const result = await access.signIn({ email, password });
    setBusy(false);
    if (!result.ok) setError(result.error.message);
  };

  return (
    <LoginView
      vm={{
        email,
        password,
        busy,
        error,
        needsBootstrap: false,
        title: 'Bison',
        description: 'Sign in to manage your business.',
      }}
      onEmail={setEmail}
      onPassword={setPassword}
      onSignIn={(event) => void signIn(event)}
      onSignUp={() => undefined}
    />
  );
};

/** Authenticated but org-less: the account isn't provisioned yet — honest
 *  notice; self-service org creation is a future arc. */
const NoOrgNotice = ({ onSignOut }: { readonly onSignOut: () => void }) => (
  <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
    <EmptyState
      icon={<CircleUserRound />}
      title="This account isn't set up yet"
      description="Your sign-in works, but no business is linked to it. Contact us to finish setting up your account."
      action={
        <Button size="sm" variant="outline" onClick={onSignOut}>
          Sign out
        </Button>
      }
    />
  </div>
);

export const RequireClientSession = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  const store = useClientGateStore();
  const gate = useStore(store, (s) => s.gate);

  useEffect(() => {
    const state = store.getState();
    void state.resolve();
    return state.subscribe();
  }, [store]);

  const signOut = () => void store.getState().signOut();

  if (gate === 'loading') {
    return <GateView vm={{ state: 'loading' }} onSignOut={signOut} />;
  }
  if (gate === 'authenticated') return <>{children}</>;
  if (gate === 'blocked') {
    return <GateView vm={{ state: 'blocked' }} onSignOut={signOut} />;
  }
  if (gate === 'no-org') return <NoOrgNotice onSignOut={signOut} />;
  return <ClientLoginSection />;
};
