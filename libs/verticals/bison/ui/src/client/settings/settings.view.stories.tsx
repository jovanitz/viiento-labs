import type { Meta, StoryObj } from '@storybook/react';
import { ClientSettingsView } from './settings.view';
import { ClientShell } from '../client.shell';

const meta: Meta<typeof ClientSettingsView> = {
  title: 'Bison Manager/Client/Settings',
  component: ClientSettingsView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof ClientSettingsView>;

const noop = () => undefined;

/** The individual account's settings: profile, messaging channels,
 *  notifications, appearance and account context. Business configuration
 *  (hours, buffers, defaults) lives with the org admin, not here. */
export const Default: Story = {
  render: () => (
    <ClientShell active="Settings">
      <ClientSettingsView
        vm={{
          profile: {
            name: 'Marco Vega',
            email: 'marco@northfade.mx',
            phone: '+52 33 8765 4321',
            photoUrl: '',
          },
          channels: { telegram: 'verified', whatsapp: 'pending' },
          notifications: {
            newBooking: true,
            cancellation: true,
            dailySummary: false,
          },
          theme: 'system',
        }}
        onSaveProfile={noop}
        onCycleChannel={noop}
        onToggleNotification={noop}
        onThemeChange={noop}
      />
    </ClientShell>
  ),
};
