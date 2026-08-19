/**
 * Settings · Profile — who the account owner is (photo, name, phone,
 * email). Editing is a deliberate action, so it earns a modal — same
 * pattern as "Edit client" (client-identity.header.tsx) — and reuses
 * ClientFormFields for the shared photo/name/phone trio, adding the
 * email field only the owner profile has.
 */
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from '@acme/ui';
import { ClientFormFields } from '../clients/client-detail/client-form.fields';
import { initialsOf } from '../clients/clients.logic';
import type { OwnerProfile } from './settings.types';

const EditProfileButton = ({
  profile,
  onSave,
}: {
  readonly profile: OwnerProfile;
  readonly onSave: (profile: OwnerProfile) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<OwnerProfile>(profile);

  const openChange = (next: boolean) => {
    if (next) setDraft(profile);
    setOpen(next);
  };

  const save = () => {
    onSave(draft);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <ClientFormFields
            draft={draft}
            onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          />
          <div className="grid gap-1.5">
            <Label htmlFor="owner-email">Email</Label>
            <Input
              id="owner-email"
              type="email"
              value={draft.email}
              onChange={(e) =>
                setDraft((d) => ({ ...d, email: e.target.value }))
              }
            />
          </div>
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

export const ProfileCard = ({
  profile,
  onSave,
}: {
  readonly profile: OwnerProfile;
  readonly onSave: (profile: OwnerProfile) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Profile</CardTitle>
      <CardDescription>How you appear across the app.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-3">
        <Avatar
          src={profile.photoUrl}
          fallback={initialsOf(profile.name) || '?'}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {profile.name}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {profile.email}
          </p>
          <p className="text-sm text-muted-foreground">
            {profile.phone || 'No phone on file'}
          </p>
        </div>
        <EditProfileButton profile={profile} onSave={onSave} />
      </div>
    </CardContent>
  </Card>
);
