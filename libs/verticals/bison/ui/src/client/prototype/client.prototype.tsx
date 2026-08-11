/**
 * Navigable client-app PROTOTYPE — the business-facing app, clickable with
 * FIXTURE data and no real logic. The sidebar switches sections; the Agenda
 * section is the grid-first Schedule simulation (client.prototype.schedule):
 * day paging and the Reorder modes (the only way to move an appointment),
 * all on local state + toasts. Navigation state lives here (a composition),
 * not in the pure `.view.tsx` files; the real app will move it to the
 * router/store.
 *
 * Account mode (individual vs organization) lives here too: the app opens in
 * individual — the owner's own calendar, everything prototyped so far — and
 * the organization view (multiple staff, assignment) doesn't exist yet, so
 * switching to it swaps in a placeholder instead of any Agenda/Clients/
 * Settings content.
 */
import { useState } from 'react';
import { Building2, Settings } from 'lucide-react';
import { EmptyState, Toaster } from '@acme/ui';
import {
  ClientShell,
  type AccountMode,
  type ClientSection,
} from '../client.shell';
import { ScheduleSim } from './client.prototype.schedule';
import { ClientsView } from '../clients/clients.view';
import { clientsVM } from './client.prototype.clients';

/** Sections that exist in the nav but aren't designed yet. */
const Placeholder = ({ section }: { readonly section: ClientSection }) => (
  <EmptyState
    className="max-w-3xl"
    icon={<Settings />}
    title={`${section} isn't designed yet`}
    description="Agenda and Clients are prototyped so far; this one lands next."
  />
);

const OrgPlaceholder = () => (
  <EmptyState
    className="max-w-3xl"
    icon={<Building2 />}
    title="Organization view isn't designed yet"
    description="Everything prototyped so far is the individual account — your own calendar. Multi-staff scheduling and assignment for an organization land as their own, separate interface."
  />
);

const content = (accountMode: AccountMode, section: ClientSection) => {
  if (accountMode === 'organization') return <OrgPlaceholder />;
  if (section === 'Agenda') return <ScheduleSim />;
  if (section === 'Clients') return <ClientsView vm={clientsVM} />;
  return <Placeholder section={section} />;
};

export const ClientPrototype = () => {
  const [section, setSection] = useState<ClientSection>('Agenda');
  const [accountMode, setAccountMode] = useState<AccountMode>('individual');
  return (
    <>
      <ClientShell
        active={section}
        onNavigate={setSection}
        accountMode={accountMode}
        onAccountModeChange={setAccountMode}
      >
        {content(accountMode, section)}
      </ClientShell>
      <Toaster />
    </>
  );
};
