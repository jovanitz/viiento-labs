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
import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { EmptyState, Toaster, toast } from '@acme/ui';
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
import { addOrGetClient, vmFromClients } from '../clients/clients.logic';
import type { ClientRow } from '../clients/clients.types';
import { ClientSettingsContainer } from '../settings/settings.container';
import type { OwnerProfile } from '../settings/settings.types';
import { TemplatesContainer } from '../templates/templates.container';
import { TEMPLATES } from '../templates/templates.fixtures';
import type { EntryTemplate } from '../templates/templates.types';
import { OWNER, clientsVM } from './client.prototype.clients';

const OrgPlaceholder = () => (
  <EmptyState
    className="max-w-3xl"
    icon={<Building2 />}
    title="Organization view isn't designed yet"
    description="Everything prototyped so far is the individual account — your own calendar. Multi-staff scheduling and assignment for an organization land as their own, separate interface."
  />
);

type ClientsNav = {
  /** From an Agenda appointment straight to that client's record. */
  readonly onOpenClientByName: (name: string) => void;
  readonly selectedClientId: string | undefined;
  readonly onSelectClient: (id: string) => void;
  readonly onBackToClients: () => void;
  readonly clients: readonly ClientRow[];
  readonly onCreateClient: (draft: ClientDraft) => ClientRow;
};

type SettingsNav = {
  readonly owner: OwnerProfile;
  readonly onSaveOwner: (owner: OwnerProfile) => void;
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
};

/** Everything the section router needs, in one bag (lint caps params at 4). */
type PrototypeNav = ClientsNav & TemplatesNav & SettingsNav;

const content = (
  accountMode: AccountMode,
  section: ClientSection,
  nav: PrototypeNav,
) => {
  const {
    selectedClientId,
    onSelectClient,
    onBackToClients,
    clients,
    onCreateClient,
  } = nav;
  if (accountMode === 'organization') return <OrgPlaceholder />;
  if (section === 'Agenda')
    return (
      <ScheduleSim
        clients={clients}
        onCreateClient={(name) =>
          onCreateClient({ name, phone: '', photoUrl: '' })
        }
        onOpenClient={nav.onOpenClientByName}
      />
    );
  if (section === 'Clients') {
    const selected = selectedClientId
      ? clients.find((c) => c.id === selectedClientId)
      : undefined;
    if (selected)
      return (
        <ClientDetailContainer
          client={selected}
          templates={nav.templates}
          formats={nav.formats}
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
  if (section === 'Templates')
    return (
      <TemplatesContainer
        templates={nav.templates}
        onSaveTemplate={nav.onSaveTemplate}
        formats={nav.formats}
        onSaveFormat={nav.onSaveFormat}
      />
    );
  return (
    <ClientSettingsContainer
      profile={nav.owner}
      onSaveProfile={nav.onSaveOwner}
    />
  );
};

const upsertTemplate = (
  templates: readonly EntryTemplate[],
  template: EntryTemplate,
): readonly EntryTemplate[] =>
  templates.some((t) => t.id === template.id)
    ? templates.map((t) => (t.id === template.id ? template : t))
    : [...templates, template];

/** Agenda → client record. Appointments only carry a name (fixture shape),
 *  so resolve against the roster; an unknown name gets a toast instead of a
 *  dead click. */
const openClient = (
  clients: readonly ClientRow[],
  name: string,
  go: (id: string) => void,
) => {
  const client = clients.find((c) => c.name === name);
  if (client) go(client.id);
  else toast.error(`No client record for ${name}`);
};

export const ClientPrototype = () => {
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
  const [owner, setOwner] = useState<OwnerProfile>(OWNER);

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
    const result = addOrGetClient(
      clients,
      draft.name,
      draft.phone,
      draft.photoUrl,
    );
    setClients(result.clients);
    toast.success(
      result.created
        ? `"${draft.name}" added to Clients`
        : `${draft.name} is already a client`,
    );
    return result.client;
  };

  return (
    <>
      <ClientShell
        active={section}
        onNavigate={navigate}
        accountMode={accountMode}
        onAccountModeChange={setAccountMode}
        owner={owner}
      >
        {content(accountMode, section, {
          onOpenClientByName: openClientByName,
          selectedClientId,
          onSelectClient: setSelectedClientId,
          onBackToClients: () => setSelectedClientId(undefined),
          clients,
          onCreateClient: createClient,
          templates,
          onSaveTemplate: (template) =>
            setTemplates((ts) => upsertTemplate(ts, template)),
          formats,
          onSaveFormat: (format) =>
            setFormats((fs) => upsertFormat(fs, format)),
          owner,
          onSaveOwner: setOwner,
        })}
      </ClientShell>
      <Toaster />
    </>
  );
};
