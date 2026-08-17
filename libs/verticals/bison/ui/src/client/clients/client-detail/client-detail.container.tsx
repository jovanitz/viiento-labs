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
import type { FillValues } from './timeline/timeline.fill.logic';
import { emptyFillValues } from './timeline/timeline.fill.logic';
import { deriveTimelineVM } from './timeline/timeline.logic';
import {
  SEED_ENTRIES,
  entryFromFilledValues,
  withFilledValues,
} from './timeline/timeline.fixtures';
import type { TimelineEntry } from './timeline/timeline.types';
import type { EntryTemplate } from '../../templates/templates.types';
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

export const ClientDetailContainer = ({
  client,
  templates,
  onBack,
}: {
  readonly client: ClientRow;
  readonly templates: readonly EntryTemplate[];
  readonly onBack: () => void;
}) => {
  const [entries, setEntries] =
    useState<readonly TimelineEntry[]>(SEED_ENTRIES);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [identity, setIdentity] = useState<ClientDraft>({
    name: client.name,
    phone: client.phone,
    photoUrl: client.photoUrl ?? '',
  });
  const [channels, setChannels] = useState<ClientChannels>(client.channels);
  const displayClient: ClientRow = { ...client, ...identity, channels };

  const saveIdentity = (draft: ClientDraft) => {
    setIdentity(draft);
    toast.success('Contact info updated');
  };

  const cycleChannel = (channel: keyof ClientChannels) => {
    const next = nextChannelStatus(channels[channel]);
    setChannels((c) => ({ ...c, [channel]: next }));
    toast.success(CHANNEL_TOAST[next](CHANNEL_NAME[channel]));
  };

  const addFromTemplate = (template: EntryTemplate) => {
    const id = `entry-${entries.length + 1}`;
    const entry = entryFromFilledValues(
      template,
      emptyFillValues(template.blocks),
      id,
      new Date(),
    );
    setEntries((e) => [entry, ...e]);
    setExpandedIds((ids) => toggle(ids, id));
    setPickerOpen(false);
    toast.success(`"${template.name}" added to the timeline`);
  };

  const saveEntryFields = (entryId: string, values: FillValues) => {
    setEntries((es) => applyFilledValues(es, templates, entryId, values));
  };

  return (
    <>
      <ClientDetailView
        client={displayClient}
        onBack={onBack}
        timelineVM={deriveTimelineVM(entries, templates)}
        expandedEntryIds={expandedIds}
        onAddEntryClick={() => setPickerOpen(true)}
        onToggleEntry={(id) => setExpandedIds((ids) => toggle(ids, id))}
        onSaveEntryFields={saveEntryFields}
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
