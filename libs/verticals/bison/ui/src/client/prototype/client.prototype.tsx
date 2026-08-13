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
 * switching to it swaps in a placeholder instead of any section's content.
 * Templates has its own nav item (not nested under Settings — Josh wants
 * Settings free for something else); Settings itself is still a placeholder.
 *
 * The template LIST also lives here (not inside TemplatesContainer) because
 * both the Templates section (manage) and Clients (consume, via "Add entry")
 * need the same live list — saving a template must show up in a client's
 * picker without a reload.
 */
import { useState } from 'react';
import { Building2, Settings as SettingsIcon } from 'lucide-react';
import { EmptyState, Toaster } from '@acme/ui';
import {
  ClientShell,
  type AccountMode,
  type ClientSection,
} from '../client.shell';
import { ScheduleSim } from './client.prototype.schedule';
import { ClientsView } from '../clients/clients.view';
import { ClientDetailContainer } from '../clients/client-detail/client-detail.container';
import { TemplatesContainer } from '../templates/templates.container';
import { TEMPLATES } from '../templates/templates.fixtures';
import type { EntryTemplate } from '../templates/templates.types';
import { clientsVM } from './client.prototype.clients';

const OrgPlaceholder = () => (
  <EmptyState
    className="max-w-3xl"
    icon={<Building2 />}
    title="Organization view isn't designed yet"
    description="Everything prototyped so far is the individual account — your own calendar. Multi-staff scheduling and assignment for an organization land as their own, separate interface."
  />
);

const SettingsPlaceholder = () => (
  <EmptyState
    className="max-w-3xl"
    icon={<SettingsIcon />}
    title="Settings isn't designed yet"
    description="Agenda, Clients and Templates are prototyped so far; this one lands next."
  />
);

type ClientsNav = {
  readonly selectedClientId: string | undefined;
  readonly onSelectClient: (id: string) => void;
  readonly onBackToClients: () => void;
};

type TemplatesNav = {
  readonly templates: readonly EntryTemplate[];
  readonly onSaveTemplate: (template: EntryTemplate) => void;
};

const content = (
  accountMode: AccountMode,
  section: ClientSection,
  clientsNav: ClientsNav,
  templatesNav: TemplatesNav,
) => {
  if (accountMode === 'organization') return <OrgPlaceholder />;
  if (section === 'Agenda') return <ScheduleSim />;
  if (section === 'Clients') {
    const { selectedClientId, onSelectClient, onBackToClients } = clientsNav;
    const selected = selectedClientId
      ? clientsVM.clients.find((c) => c.id === selectedClientId)
      : undefined;
    if (selected)
      return (
        <ClientDetailContainer
          client={selected}
          templates={templatesNav.templates}
          onBack={onBackToClients}
        />
      );
    return <ClientsView vm={clientsVM} onSelectClient={onSelectClient} />;
  }
  if (section === 'Templates')
    return (
      <TemplatesContainer
        templates={templatesNav.templates}
        onSaveTemplate={templatesNav.onSaveTemplate}
      />
    );
  return <SettingsPlaceholder />;
};

const upsertTemplate = (
  templates: readonly EntryTemplate[],
  template: EntryTemplate,
): readonly EntryTemplate[] =>
  templates.some((t) => t.id === template.id)
    ? templates.map((t) => (t.id === template.id ? template : t))
    : [...templates, template];

export const ClientPrototype = () => {
  const [section, setSection] = useState<ClientSection>('Agenda');
  const [accountMode, setAccountMode] = useState<AccountMode>('individual');
  const [selectedClientId, setSelectedClientId] = useState<string>();
  const [templates, setTemplates] =
    useState<readonly EntryTemplate[]>(TEMPLATES);

  // Switching sections (or account mode) always leaves the client detail
  // drill-down behind — coming back to Clients later should land on the
  // roster, not wherever you left off.
  const navigate = (next: ClientSection) => {
    setSelectedClientId(undefined);
    setSection(next);
  };

  return (
    <>
      <ClientShell
        active={section}
        onNavigate={navigate}
        accountMode={accountMode}
        onAccountModeChange={setAccountMode}
      >
        {content(
          accountMode,
          section,
          {
            selectedClientId,
            onSelectClient: setSelectedClientId,
            onBackToClients: () => setSelectedClientId(undefined),
          },
          {
            templates,
            onSaveTemplate: (template) =>
              setTemplates((ts) => upsertTemplate(ts, template)),
          },
        )}
      </ClientShell>
      <Toaster />
    </>
  );
};
