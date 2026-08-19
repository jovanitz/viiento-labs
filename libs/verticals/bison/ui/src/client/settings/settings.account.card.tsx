/**
 * Settings · Account — read-only context about WHICH account this is.
 * It exists mostly to state the split out loud: business settings
 * (name, working hours, buffers, scheduling defaults) live with the
 * organization admin, not in the individual profile — so the owner
 * knows where to look instead of hunting for them here.
 */
import { UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@acme/ui';

export const AccountCard = ({ email }: { readonly email: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>Account</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground">
          <UserRound className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            Individual account
          </p>
          <p className="truncate text-sm text-muted-foreground">
            Signed in as {email}. You manage your own calendar and clients.
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Business settings — name, working hours, buffers and scheduling defaults
        — live in the organization admin account. Use the switcher in the
        top-left corner to change accounts.
      </p>
    </CardContent>
  </Card>
);
