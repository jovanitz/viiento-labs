/**
 * Bison Manager · Client · Settings — the INDIVIDUAL account's settings:
 * the owner's profile, this account's messaging channels, personal
 * notification preferences, appearance, and account context. Business
 * configuration (business name, working hours, buffers, scheduling
 * defaults) is deliberately absent — it belongs to the organization
 * admin's account.
 *
 * @screen Bison Manager / Client / Settings
 * @phase draft
 *
 * Presentational: a pure function of (ViewModel + actions).
 */
import { Stack } from '@acme/ui';
import { AccountCard } from './settings.account.card';
import { MessagingCard } from './settings.channels.card';
import {
  AppearanceCard,
  NotificationsCard,
} from './settings.preferences.cards';
import { ProfileCard } from './settings.profile.card';
import type { ClientChannels } from '../clients/clients.types';
import type {
  NotificationPrefs,
  OwnerProfile,
  ThemeChoice,
} from './settings.types';

export type ClientSettingsVM = {
  readonly profile: OwnerProfile;
  readonly channels: ClientChannels;
  readonly notifications: NotificationPrefs;
  readonly theme: ThemeChoice;
};

export type ClientSettingsActions = {
  readonly onSaveProfile: (profile: OwnerProfile) => void;
  readonly onCycleChannel: (channel: keyof ClientChannels) => void;
  readonly onToggleNotification: (
    key: keyof NotificationPrefs,
    value: boolean,
  ) => void;
  readonly onThemeChange: (theme: ThemeChoice) => void;
};

export const ClientSettingsView = ({
  vm,
  onSaveProfile,
  onCycleChannel,
  onToggleNotification,
  onThemeChange,
}: { readonly vm: ClientSettingsVM } & ClientSettingsActions) => (
  <Stack gap="group" className="max-w-2xl">
    <div>
      <h1 className="text-xl font-semibold text-foreground">Settings</h1>
      <p className="text-sm text-muted-foreground">
        Your profile and preferences for this account.
      </p>
    </div>
    <ProfileCard profile={vm.profile} onSave={onSaveProfile} />
    <MessagingCard channels={vm.channels} onCycleChannel={onCycleChannel} />
    <NotificationsCard
      prefs={vm.notifications}
      onToggle={onToggleNotification}
    />
    <AppearanceCard theme={vm.theme} onThemeChange={onThemeChange} />
    <AccountCard email={vm.profile.email} />
  </Stack>
);
