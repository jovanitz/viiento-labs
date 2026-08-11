import type { Meta, StoryObj } from '@storybook/react';
import { ClientPrototype } from './client.prototype';

const meta: Meta<typeof ClientPrototype> = {
  title: 'Bison Manager/Client/Prototype',
  component: ClientPrototype,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof ClientPrototype>;

/**
 * Clickable, navigable prototype of the client app — no real logic. The Agenda
 * pages across fixture days (closed / busy / sparse / free / failing-to-load);
 * status changes and scheduling confirm with toasts; Clients and Settings are
 * placeholders until they're designed.
 */
export const Navigable: Story = {};
