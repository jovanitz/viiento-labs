/**
 * Roster/template helpers for the prototype composition — the add-or-reuse
 * client flow (with its toasts) and the template upsert, kept out of
 * client.prototype.tsx so the composition stays within the size caps.
 * Prototype-only plumbing; the wired sections replace it store by store.
 */
import { toast } from '@acme/ui';
import { addOrGetClient } from '../clients/clients.logic';
import type { ClientRow } from '../clients/clients.types';
import type { ClientDraft } from '../clients/client-detail/client-form.fields';
import type { EntryTemplate } from '../templates/templates.types';

export const upsertTemplate = (
  templates: readonly EntryTemplate[],
  template: EntryTemplate,
): readonly EntryTemplate[] =>
  templates.some((t) => t.id === template.id)
    ? templates.map((t) => (t.id === template.id ? template : t))
    : [...templates, template];

/** Agenda → client record. Appointments only carry a name (fixture shape),
 *  so resolve against the roster; an unknown name gets a toast instead of a
 *  dead click. */
export const openClient = (
  clients: readonly ClientRow[],
  name: string,
  go: (id: string) => void,
) => {
  const client = clients.find((c) => c.name === name);
  if (client) go(client.id);
  else toast.error(`No client record for ${name}`);
};

/** Roster add-or-reuse with its toast. */
export const createClientRow = (
  clients: readonly ClientRow[],
  draft: ClientDraft,
): { clients: readonly ClientRow[]; client: ClientRow } => {
  const result = addOrGetClient(
    clients,
    draft.name,
    draft.phone,
    draft.photoUrl,
  );
  toast.success(
    result.created
      ? `"${draft.name}" added to Clients`
      : `${draft.name} is already a client`,
  );
  return result;
};
