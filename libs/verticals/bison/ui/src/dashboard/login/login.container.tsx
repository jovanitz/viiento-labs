import { useEffect, useState, type FormEvent } from 'react';
import { useUseCases } from '../../di';
import { LoginView } from './login.view';

/**
 * Wiring seam for the staff sign-in view.
 *
 * Login-only by design: staff accounts arrive by invitation, never
 * self-service. The ONE exception is first run — while no root admin exists the
 * screen also offers a one-time owner sign-up. The server's `rootAdminExists`
 * guard is the real gate; this only decides whether to show the button.
 *
 * On success the auth provider fires its change event and the gate re-resolves
 * into the dashboard, so there is nothing to navigate here.
 */

/** First-run check (pre-auth). Self-correcting if the component unmounts mid-flight. */
const useNeedsBootstrap = (): boolean => {
  const { access } = useUseCases();
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  useEffect(() => {
    let active = true;
    void access.needsBootstrap().then((result) => {
      if (active && result.ok) setNeedsBootstrap(result.value);
    });
    return () => {
      active = false;
    };
  }, [access]);
  return needsBootstrap;
};

export const LoginSection = ({
  notice,
}: {
  /** Shown above the form, e.g. when a signed-in user lacks staff access. */
  readonly notice?: string;
}) => {
  const { access } = useUseCases();
  const needsBootstrap = useNeedsBootstrap();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = async (event: FormEvent, flow: 'signIn' | 'signUp') => {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    const result =
      flow === 'signUp'
        ? await access.signUp({ email, password })
        : await access.signIn({ email, password });
    setBusy(false);
    if (!result.ok) setError(result.error.message);
  };

  return (
    <LoginView
      vm={{ email, password, busy, error, notice, needsBootstrap }}
      onEmail={setEmail}
      onPassword={setPassword}
      onSignIn={(e) => void submit(e, 'signIn')}
      onSignUp={(e) => void submit(e, 'signUp')}
    />
  );
};
