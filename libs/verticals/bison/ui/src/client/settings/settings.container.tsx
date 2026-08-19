/**
 * Settings container for the navigable prototype. The owner PROFILE
 * lives up in client.prototype.tsx (the topbar UserMenu shows the same
 * identity, so editing it here must update the shell too — same lifting
 * rule as templates/clients); channels, notification prefs and theme are
 * session-local, since nothing else reads them yet.
 *
 * Theme is applied only when the user picks — toggling the `.dark` class
 * the theme tokens key off — never on mount, so it doesn't fight the
 * host's (Storybook's) own theme toggle.
 */
import { useState } from 'react';
import { toast } from '@acme/ui';
import { nextChannelStatus } from '../clients/clients.logic';
import type { ChannelStatus, ClientChannels } from '../clients/clients.types';
import { ClientSettingsView } from './settings.view';
import type {
  NotificationPrefs,
  OwnerProfile,
  ThemeChoice,
} from './settings.types';

const DISCONNECTED: ClientChannels = {
  telegram: 'not_connected',
  whatsapp: 'not_connected',
};

const DEFAULT_PREFS: NotificationPrefs = {
  newBooking: true,
  cancellation: true,
  dailySummary: false,
};

// Same copy as the per-client badges (client-detail.container.tsx), so
// connecting reads identically on both surfaces.
const CHANNEL_NAME: Record<keyof ClientChannels, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
};
const CHANNEL_TOAST: Record<ChannelStatus, (name: string) => string> = {
  pending: (name) => `Connecting ${name}… waiting for confirmation.`,
  verified: (name) => `${name} connected.`,
  not_connected: (name) => `${name} disconnected.`,
};

const applyTheme = (theme: ThemeChoice) => {
  const dark =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : theme === 'dark';
  // Both roots: the app keys off <html>, but Storybook's dark-mode addon
  // stamps <body>, and either ancestor makes Tailwind's `dark:` match.
  document.documentElement.classList.toggle('dark', dark);
  document.body.classList.toggle('dark', dark);
};

export const ClientSettingsContainer = ({
  profile,
  onSaveProfile,
}: {
  readonly profile: OwnerProfile;
  readonly onSaveProfile: (profile: OwnerProfile) => void;
}) => {
  const [channels, setChannels] = useState<ClientChannels>(DISCONNECTED);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [theme, setTheme] = useState<ThemeChoice>('system');

  const cycleChannel = (channel: keyof ClientChannels) => {
    const next = nextChannelStatus(channels[channel]);
    setChannels((c) => ({ ...c, [channel]: next }));
    toast.success(CHANNEL_TOAST[next](CHANNEL_NAME[channel]));
  };

  return (
    <ClientSettingsView
      vm={{ profile, channels, notifications: prefs, theme }}
      onSaveProfile={(next) => {
        onSaveProfile(next);
        toast.success('Profile updated');
      }}
      onCycleChannel={cycleChannel}
      onToggleNotification={(key, value) =>
        setPrefs((p) => ({ ...p, [key]: value }))
      }
      onThemeChange={(next) => {
        setTheme(next);
        applyTheme(next);
      }}
    />
  );
};
