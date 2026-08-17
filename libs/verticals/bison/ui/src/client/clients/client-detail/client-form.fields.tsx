/**
 * Shared client identity form — photo picker + name + phone. Used by both
 * "Edit client" (client-identity.header.tsx, prefilled from an existing
 * client) and "+ New client" (clients.view.tsx, blank draft), so the photo
 * picker's real file-input behavior isn't duplicated between the two.
 * The photo field simulates picking an image from the device's own
 * gallery/camera — a real `<input type="file">`, previewed via a local
 * blob URL — rather than pasting a URL. No upload happens, but the
 * interaction (open the picker, pick a file, see it applied) is real.
 */
import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Camera } from 'lucide-react';
import { Avatar, Input, Label } from '@acme/ui';
import { initialsOf } from '../clients.logic';
import type { ClientRow } from '../clients.types';

export type ClientDraft = {
  readonly name: string;
  readonly phone: string;
  readonly photoUrl: string;
};

export const BLANK_CLIENT_DRAFT: ClientDraft = {
  name: '',
  phone: '',
  photoUrl: '',
};

export const draftFrom = (client: ClientRow): ClientDraft => ({
  name: client.name,
  phone: client.phone,
  photoUrl: client.photoUrl ?? '',
});

const PhotoPicker = ({
  photoUrl,
  fallback,
  onPick,
}: {
  readonly photoUrl: string;
  readonly fallback: string;
  readonly onPick: (url: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPick(URL.createObjectURL(file));
  };
  return (
    <div className="relative w-fit">
      <Avatar src={photoUrl} fallback={fallback} size="lg" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Choose photo"
        className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Camera className="size-3.5" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={pickFile}
        className="hidden"
      />
    </div>
  );
};

export const ClientFormFields = ({
  draft,
  onChange,
}: {
  readonly draft: ClientDraft;
  readonly onChange: (patch: Partial<ClientDraft>) => void;
}) => (
  <>
    <PhotoPicker
      photoUrl={draft.photoUrl}
      fallback={initialsOf(draft.name) || '?'}
      onPick={(photoUrl) => onChange({ photoUrl })}
    />
    <div className="grid gap-1.5">
      <Label htmlFor="client-name">Name</Label>
      <Input
        id="client-name"
        value={draft.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="client-phone">Phone</Label>
      <Input
        id="client-phone"
        value={draft.phone}
        onChange={(e) => onChange({ phone: e.target.value })}
      />
    </div>
  </>
);
