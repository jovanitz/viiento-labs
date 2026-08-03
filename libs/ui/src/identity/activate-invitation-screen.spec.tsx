import { afterEach, describe, expect, it } from 'vitest';
import { err, ok } from '@acme/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { InvitationsUseCases } from '@acme/application';
import { ActivateInvitationScreen } from './activate-invitation-screen';

/**
 * The mock is local rather than imported from a vertical's `testing.ts`: this
 * screen is shared chrome (ADR-0019), so its spec must not reach into lab or
 * bison. It also needs no `UseCasesProvider` any more — the bundle is a prop.
 */
const mockInvitations = (
  overrides: Partial<InvitationsUseCases> = {},
): InvitationsUseCases => ({
  invite: async () => ok({ invitationId: 'inv-1', token: 'tok-1' }),
  activate: async () => ok({ email: 'new@acme.test' }),
  listPending: async () => ok([]),
  regenerate: async () => ok({ token: 'fresh-tok-1' }),
  revoke: async () => ok(undefined),
  resend: async () => ok(undefined),
  ...overrides,
});

const renderWithHash = (
  hash: string,
  invitations: InvitationsUseCases = mockInvitations(),
) => {
  window.location.hash = hash;
  return render(<ActivateInvitationScreen invitations={invitations} />);
};

afterEach(() => {
  window.location.hash = '';
});

const setPasswordAndSubmit = () => {
  fireEvent.change(screen.getByLabelText(/new password/i), {
    target: { value: 'sup3r-secret' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Activate' }));
};

describe('ActivateInvitationScreen', () => {
  it('activates with the token from the URL fragment', async () => {
    renderWithHash('#token=abc123');
    setPasswordAndSubmit();
    await waitFor(() =>
      expect(screen.getByText(/account activated/i)).toBeInTheDocument(),
    );
  });

  it('refuses when the link has no token', () => {
    renderWithHash('#nope=1');
    expect(screen.getByRole('alert')).toHaveTextContent(/missing its token/i);
  });

  it('surfaces a server error (e.g. invalid/expired token)', async () => {
    renderWithHash(
      '#token=bad',
      mockInvitations({
        activate: async () =>
          err({
            tag: 'app/invitation-token-invalid',
            message: 'Invalid or expired invitation.',
          }),
      }),
    );
    setPasswordAndSubmit();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid or expired'),
    );
  });
});
