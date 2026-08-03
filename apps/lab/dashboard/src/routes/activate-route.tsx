import { ActivateInvitationScreen } from '@acme/ui';
import { useUseCases } from '@acme/lab-ui';

/**
 * The PUBLIC activation route — no auth gate. The invitee arrives here from the
 * activation link (token in the URL fragment) to set their password. Its own
 * lazy chunk, like the dashboard route.
 *
 * The screen is shared identity chrome in `@acme/ui`, so this route injects the
 * bundle: core reads no vertical's seam (ADR-0019). Lab's bundle serves five
 * apps, hence the guard — bison's, being one app, needs none.
 */
const ActivateRoute = () => {
  const { invitations } = useUseCases();
  if (!invitations) {
    return <p>Invitation use cases are not wired in this app yet.</p>;
  }
  return <ActivateInvitationScreen invitations={invitations} />;
};

export default ActivateRoute;
