/**
 * Client Detail — identity header. Two different kinds of "editing" live
 * side by side on purpose:
 * - Name/photo/phone are a focused, deliberate action — like Block time
 *   (block-time.dialog.tsx), it earns a modal's dimmed backdrop, unlike the
 *   Timeline's inline entry editing (a quick aside inside content you're
 *   already looking at, not its own separate task). Form fields themselves
 *   live in client-form.fields.tsx, shared with "+ New client"
 *   (clients.view.tsx).
 * - Telegram/WhatsApp connection state lives in client-channels.row.tsx —
 *   not data you type, so it isn't part of this edit form.
 */
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import {
  Avatar,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@acme/ui';
import { ChannelsRow } from './client-channels.row';
import {
  ClientFormFields,
  draftFrom,
  type ClientDraft,
} from './client-form.fields';
import type { ClientChannels, ClientRow } from '../clients.types';

const EditClientButton = ({
  client,
  onSave,
}: {
  readonly client: ClientRow;
  readonly onSave: (draft: ClientDraft) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ClientDraft>(draftFrom(client));

  const openChange = (next: boolean) => {
    if (next) setDraft(draftFrom(client));
    setOpen(next);
  };

  const save = () => {
    onSave(draft);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="shrink-0">
          <Pencil /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <ClientFormFields
            draft={draft}
            onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          />
          <Button
            type="button"
            onClick={save}
            disabled={draft.name.trim() === ''}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ClientIdentityHeader = ({
  client,
  onSaveIdentity,
  onCycleChannel,
}: {
  readonly client: ClientRow;
  readonly onSaveIdentity: (draft: ClientDraft) => void;
  readonly onCycleChannel: (channel: keyof ClientChannels) => void;
}) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
    <div className="flex flex-1 items-center gap-3">
      <Avatar src={client.photoUrl} fallback={client.initials} size="lg" />
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold text-foreground">{client.name}</h1>
        <p className="text-sm text-muted-foreground">
          {client.phone || 'No phone on file'}
        </p>
      </div>
      <EditClientButton client={client} onSave={onSaveIdentity} />
    </div>
    <ChannelsRow channels={client.channels} onCycleChannel={onCycleChannel} />
  </div>
);
