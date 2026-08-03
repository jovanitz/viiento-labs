import { useEffect, type ReactNode } from 'react';
import { useAdminGateStore, useStore } from '../store/hooks';
import { LoginSection } from '../login/login.container';
import { GateView } from './gate.view';

/**
 * Bison's staff route guard — the vertical's own, end to end
 * ([ADR-0019](../../../../../../docs/adr/0019-vertical-tag-axis.md)). It used to
 * borrow `RequireAdmin` from the lab template, which meant Bison's
 * authentication would have walked out with the template.
 *
 * The four-way decision (anonymous / forbidden / blocked / authorized) is NOT
 * re-implemented: it stays in the shared `resolveAdminGate` controller, reached
 * through the gate store. This is only the reactive shell that re-resolves on
 * auth changes and maps each state to a view.
 */
export const RequireStaff = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  const store = useAdminGateStore();
  const gate = useStore(store, (s) => s.gate);

  useEffect(() => {
    const s = store.getState();
    void s.resolve();
    return s.subscribe();
  }, [store]);

  const signOut = () => void store.getState().signOut();

  if (gate === 'loading') {
    return <GateView vm={{ state: 'loading' }} onSignOut={signOut} />;
  }
  if (gate === 'authorized') return <>{children}</>;
  if (gate === 'blocked') {
    return <GateView vm={{ state: 'blocked' }} onSignOut={signOut} />;
  }
  if (gate === 'forbidden') {
    return (
      <LoginSection notice="This account has no staff access to the dashboard." />
    );
  }
  return <LoginSection />;
};
