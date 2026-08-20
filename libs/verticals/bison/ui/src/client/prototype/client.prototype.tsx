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
 * picker without a reload. The client ROSTER lives here for the same
 * reason: Clients' "+ New client" and the New-appointment Combobox's inline
 * "Create '<name>'" both add to the same list, and each must see what the
 * other just created.
 */
import { useState, type ReactNode } from 'react';
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
import {
  SHIPPED_FORMATS,
  upsertFormat,
} from '../templates/document/document.format';
import type { DocumentFormat } from '../templates/document/document.format';
import type { ClientDraft } from '../clients/client-detail/client-form.fields';
import { vmFromClients } from '../clients/clients.logic';
import type { ClientRow } from '../clients/clients.types';
import { TemplatesContainer } from '../templates/templates.container';
import { TEMPLATES } from '../templates/templates.fixtures';
import type { EntryTemplate } from '../templates/templates.types';
import { clientsVM } from './client.prototype.clients';
import {
  createClientRow,
  openClient,
  upsertTemplate,
} from './client.prototype.roster';

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
  /** When set (by the app), the Agenda section renders THIS — the wired
   *  grid — instead of the fixture ScheduleSim. */
  readonly wiredAgenda?: ReactNode;
  /** From an Agenda appointment straight to that client's record. */
  readonly onOpenClientByName: (name: string) => void;
  readonly selectedClientId: string | undefined;
  readonly onSelectClient: (id: string) => void;
  readonly onBackToClients: () => void;
  readonly clients: readonly ClientRow[];
  readonly onCreateClient: (draft: ClientDraft) => ClientRow;
  /** When set (by the app), the Clients section renders THIS — the wired
   *  container — instead of the fixture roster below. */
  readonly wiredSection?: ReactNode;
};

type TemplatesNav = {
  readonly templates: readonly EntryTemplate[];
  readonly onSaveTemplate: (template: EntryTemplate) => void;
  /**
   * The account's document wrappers (ADR-0021). Lifted here for the same
   * reason `templates` is: a format tweaked in Templates has to be what a
   * client's Timeline offers in the same session. Seeded with the shipped
   * example catalog.
   */
  readonly formats: readonly DocumentFormat[];
  readonly onSaveFormat: (format: DocumentFormat) => void;
  /** When set (by the app), the Templates section renders THIS — the wired
   *  container — instead of the fixture-lifted composition below. */
  readonly wiredSection?: ReactNode;
};

const content = (
  accountMode: AccountMode,
  section: ClientSection,
  clientsNav: ClientsNav,
  templatesNav: TemplatesNav,
) => {
  const {
    selectedClientId,
    onSelectClient,
    onBackToClients,
    clients,
    onCreateClient,
  } = clientsNav;
  if (accountMode === 'organization') return <OrgPlaceholder />;
  if (section === 'Agenda') {
    if (clientsNav.wiredAgenda) return clientsNav.wiredAgenda;
    return (
      <ScheduleSim
        clients={clients}
        onCreateClient={(name) =>
          onCreateClient({ name, phone: '', photoUrl: '' })
        }
        onOpenClient={clientsNav.onOpenClientByName}
      />
    );
  }
  if (section === 'Clients') {
    // The app injects the WIRED section here (store + gateway); absent —
    // stories, the bare prototype — the fixture roster below still runs.
    if (clientsNav.wiredSection) return clientsNav.wiredSection;
    const selected = selectedClientId
      ? clients.find((c) => c.id === selectedClientId)
      : undefined;
    if (selected)
      return (
        <ClientDetailContainer
          client={selected}
          templates={templatesNav.templates}
          formats={templatesNav.formats}
          onBack={onBackToClients}
        />
      );
    return (
      <ClientsView
        vm={vmFromClients(clients)}
        onSelectClient={onSelectClient}
        onCreateClient={onCreateClient}
      />
    );
  }
  if (section === 'Templates') {
    if (templatesNav.wiredSection) return templatesNav.wiredSection;
    return (
      <TemplatesContainer
        templates={templatesNav.templates}
        onSaveTemplate={templatesNav.onSaveTemplate}
        formats={templatesNav.formats}
        onSaveFormat={templatesNav.onSaveFormat}
      />
    );
  }
  return <SettingsPlaceholder />;
};

export const ClientPrototype = ({
  agendaSection,
  clientsSection,
  templatesSection,
}: {
  /** When set, the matching section renders the wired container instead
   *  of its fixture composition. Absent sections stay prototype. */
  readonly agendaSection?: ReactNode;
  readonly clientsSection?: ReactNode;
  readonly templatesSection?: ReactNode;
} = {}) => {
  const [section, setSection] = useState<ClientSection>('Agenda');
  const [accountMode, setAccountMode] = useState<AccountMode>('individual');
  const [selectedClientId, setSelectedClientId] = useState<string>();
  const [formats, setFormats] =
    useState<readonly DocumentFormat[]>(SHIPPED_FORMATS);
  const [templates, setTemplates] =
    useState<readonly EntryTemplate[]>(TEMPLATES);
  const [clients, setClients] = useState<readonly ClientRow[]>(
    clientsVM.clients,
  );

  // Switching sections (or account mode) always leaves the client detail
  // drill-down behind — coming back to Clients later should land on the
  // roster, not wherever you left off.
  const navigate = (next: ClientSection) => {
    setSelectedClientId(undefined);
    setSection(next);
  };

  const openClientByName = (name: string) =>
    openClient(clients, name, (id) => {
      setSelectedClientId(id);
      setSection('Clients');
    });

  const createClient = (draft: ClientDraft): ClientRow => {
    const result = createClientRow(clients, draft);
    setClients(result.clients);
    return result.client;
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
            wiredAgenda: agendaSection,
            onOpenClientByName: openClientByName,
            selectedClientId,
            onSelectClient: setSelectedClientId,
            onBackToClients: () => setSelectedClientId(undefined),
            clients,
            onCreateClient: createClient,
            wiredSection: clientsSection,
          },
          {
            templates,
            onSaveTemplate: (template) =>
              setTemplates((ts) => upsertTemplate(ts, template)),
            formats,
            onSaveFormat: (format) =>
              setFormats((fs) => upsertFormat(fs, format)),
            wiredSection: templatesSection,
          },
        )}
      </ClientShell>
      <Toaster />
    </>
  );
};
