import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Avatar,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type Org,
} from '@acme/ui';

/** Which "actor" the app is showing: the account owner's own calendar, or an
 *  organization they belong to (multi-staff — a separate, not-yet-designed
 *  interface). Defaults to individual on open; see client.prototype.tsx. */
export type AccountMode = 'individual' | 'organization';

/** The default account owner — matches UserMenu's identity in
 *  client.shell.tsx until real auth exists. In individual mode, every
 *  booking is implicitly theirs (see ACCOUNT_OWNER_NAME in
 *  schedule/new-appointment/new-appointment.form.tsx). The shell overrides
 *  this via the `owner` prop once the profile is editable (Settings). */
export const ACCOUNT_OWNER = { name: 'Marco Vega', fallback: 'MV' };

type OwnerIdentity = typeof ACCOUNT_OWNER;

const logoClass = 'rounded-md bg-primary text-primary-foreground';

const IndividualRow = ({
  owner,
  active,
  onSelect,
}: {
  readonly owner: OwnerIdentity;
  readonly active: boolean;
  readonly onSelect: () => void;
}) => (
  <DropdownMenuItem className="gap-2" onSelect={onSelect}>
    <Avatar size="sm" fallback={owner.fallback} className={logoClass} />
    <span className="flex-1 truncate text-sm font-medium">{owner.name}</span>
    {active ? <Check className="size-4 shrink-0 text-primary" /> : null}
  </DropdownMenuItem>
);

const OrgRow = ({
  org,
  active,
  onSelect,
}: {
  readonly org: Org;
  readonly active: boolean;
  readonly onSelect: () => void;
}) => (
  <DropdownMenuItem className="gap-2" onSelect={onSelect}>
    <Avatar size="sm" fallback={org.fallback} className={logoClass} />
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="flex items-center gap-1.5">
        <span className="truncate text-sm font-medium">{org.name}</span>
        {org.owner ? (
          <Badge
            variant="secondary"
            className="h-4 shrink-0 px-1.5 text-[10px] font-medium"
          >
            Owner
          </Badge>
        ) : null}
      </span>
    </span>
    {active ? <Check className="size-4 shrink-0 text-primary" /> : null}
  </DropdownMenuItem>
);

/** Individual ↔ organization actor switcher. Same visual recipe as the DS
 *  OrgSwitcher (Avatar/Badge/Check), but with an extra "Individual" section
 *  above the org list — a concept that's specific to this vertical's account
 *  model, not a generic multi-org picker, so it's composed locally rather
 *  than bolted onto the shared primitive. */
export const AccountSwitcher = ({
  mode,
  onModeChange,
  org,
  owner = ACCOUNT_OWNER,
}: {
  readonly mode: AccountMode;
  readonly onModeChange?: ((mode: AccountMode) => void) | undefined;
  readonly org: Org;
  /** The individual account's identity; defaults to the fixture owner. */
  readonly owner?: OwnerIdentity;
}) => {
  const current = mode === 'individual' ? owner : org;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account: ${current.name}`}
        className="inline-flex h-9 items-center gap-2 rounded-md px-1.5 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar size="sm" fallback={current.fallback} className={logoClass} />
        <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">
          {current.name}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Individual
        </DropdownMenuLabel>
        <IndividualRow
          owner={owner}
          active={mode === 'individual'}
          onSelect={() => onModeChange?.('individual')}
        />
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        <OrgRow
          org={org}
          active={mode === 'organization'}
          onSelect={() => onModeChange?.('organization')}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
