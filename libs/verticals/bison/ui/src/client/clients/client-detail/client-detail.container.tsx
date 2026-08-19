/**
 * Client Detail — stateful composition for the navigable prototype. Owns
 * the Timeline's local state (entries added this session, which entries
 * are expanded, picker open state); `.view.tsx` files stay pure functions
 * of VM + actions, same discipline as client.prototype.schedule.tsx.
 * Picking a template attaches it immediately, blank, and expanded — filling
 * it in is a separate, inline step via that entry's Edit button (no second
 * modal). `templates` comes from client.prototype.tsx (lifted there, not
 * read from the fixture directly) so a template saved in Templates shows up
 * here immediately.
 */
import { useState } from 'react';
import { toast } from '@acme/ui';
import { ClientDetailView } from './client-detail.view';
import type { ClientDraft } from './client-form.fields';
import { TemplatePickerDialog } from './timeline/template-picker/template-picker.dialog';
import type { FillValues } from './timeline/fill/timeline.fill.logic';
import { emptyFillValues } from './timeline/fill/timeline.fill.logic';
import { deriveTimelineVM } from './timeline/timeline.logic';
import {
  SEED_ENTRIES,
  entryFromFilledValues,
  withFilledValues,
} from './timeline/timeline.fixtures';
import type { TimelineEntry } from './timeline/timeline.types';
import type { EntryTemplate } from '../../templates/templates.types';
import { EntryDocument } from '../../templates/document/document.prototype';
import type { DocumentFormat } from '../../templates/document/document.format';
import { valuesFromFields } from './timeline/fill/timeline.fill.logic';
import { nextChannelStatus } from '../clients.logic';
import type {
  ChannelStatus,
  ClientChannels,
  ClientRow,
} from '../clients.types';

const toggle = (ids: ReadonlySet<string>, id: string): ReadonlySet<string> => {
  const next = new Set(ids);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

const applyFilledValues = (
  entries: readonly TimelineEntry[],
  templates: readonly EntryTemplate[],
  entryId: string,
  values: FillValues,
): readonly TimelineEntry[] =>
  entries.map((e) => {
    if (e.id !== entryId) return e;
    const template = templates.find((t) => t.id === e.templateId);
    return template ? withFilledValues(e, template, values) : e;
  });

const CHANNEL_NAME: Record<keyof ClientChannels, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
};

const CHANNEL_TOAST: Record<ChannelStatus, (name: string) => string> = {
  pending: (name) => `Connecting ${name}… waiting for confirmation.`,
  verified: (name) => `${name} connected.`,
  not_connected: (name) => `${name} disconnected.`,
};

/** The entry being printed, with the template it was filled from — both or
 *  neither, so the caller has a single thing to test. */
const documentTarget = (
  entries: readonly TimelineEntry[],
  templates: readonly EntryTemplate[],
  entryId: string | undefined,
) => {
  const entry = entries.find((e) => e.id === entryId);
  const template = templates.find((t) => t.id === entry?.templateId);
  return entry && template ? { entry, template } : undefined;
};

/** The Timeline's own state: which entries exist, which are open, and the
 *  template picker. Split out so the container reads as routing rather
 *  than as a pile of useState. */
const useTimelineEntries = (templates: readonly EntryTemplate[]) => {
  const [entries, setEntries] =
    useState<readonly TimelineEntry[]>(SEED_ENTRIES);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  return {
    entries,
    expandedIds,
    pickerOpen,
    setPickerOpen,
    toggleEntry: (id: string) => setExpandedIds((ids) => toggle(ids, id)),
    addFromTemplate: (template: EntryTemplate) => {
      const id = `entry-${entries.length + 1}`;
      const values = emptyFillValues(template.blocks);
      setEntries((e) => [
        entryFromFilledValues(template, values, id, new Date()),
        ...e,
      ]);
      setExpandedIds((ids) => toggle(ids, id));
      setPickerOpen(false);
      toast.success(`"${template.name}" added to the timeline`);
    },
    saveEntryFields: (entryId: string, values: FillValues) =>
      setEntries((es) => applyFilledValues(es, templates, entryId, values)),
  };
};

/** Identity + channels are the client's own editable state, independent of
 *  the Timeline — kept together so the container stays readable. */
const useClientIdentity = (client: ClientRow) => {
  const [identity, setIdentity] = useState<ClientDraft>({
    name: client.name,
    phone: client.phone,
    photoUrl: client.photoUrl ?? '',
  });
  const [channels, setChannels] = useState<ClientChannels>(client.channels);

  return {
    displayClient: { ...client, ...identity, channels } as ClientRow,
    saveIdentity: (draft: ClientDraft) => {
      setIdentity(draft);
      toast.success('Contact info updated');
    },
    cycleChannel: (channel: keyof ClientChannels) => {
      const next = nextChannelStatus(channels[channel]);
      setChannels((c) => ({ ...c, [channel]: next }));
      toast.success(CHANNEL_TOAST[next](CHANNEL_NAME[channel]));
    },
  };
};

export const ClientDetailContainer = ({
  client,
  templates,
  formats,
  onBack,
}: {
  readonly client: ClientRow;
  readonly templates: readonly EntryTemplate[];
  /** The account's document wrappers (ADR-0021) — every entry can print,
   *  the format is picked on the Document screen. */
  readonly formats: readonly DocumentFormat[];
  readonly onBack: () => void;
}) => {
  const {
    entries,
    expandedIds,
    pickerOpen,
    setPickerOpen,
    toggleEntry,
    addFromTemplate,
    saveEntryFields,
  } = useTimelineEntries(templates);
  const { displayClient, saveIdentity, cycleChannel } =
    useClientIdentity(client);
  // Which entry is being looked at as a printed document. Issuing belongs
  // to an ENTRY, not to a template: only an entry carries values.
  const [documentEntryId, setDocumentEntryId] = useState<string | undefined>();

  const target = documentTarget(entries, templates, documentEntryId);
  if (target)
    return (
      <EntryDocument
        template={target.template}
        formats={formats}
        values={valuesFromFields(target.template.blocks, target.entry.fields)}
        clientName={displayClient.name}
        onBack={() => setDocumentEntryId(undefined)}
      />
    );

  return (
    <>
      <ClientDetailView
        client={displayClient}
        onBack={onBack}
        timelineVM={deriveTimelineVM(entries, templates)}
        expandedEntryIds={expandedIds}
        onAddEntryClick={() => setPickerOpen(true)}
        onToggleEntry={toggleEntry}
        onSaveEntryFields={saveEntryFields}
        onOpenEntryDocument={setDocumentEntryId}
        onSaveIdentity={saveIdentity}
        onCycleChannel={cycleChannel}
      />
      <TemplatePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        templates={templates}
        onSelectTemplate={addFromTemplate}
      />
    </>
  );
};
