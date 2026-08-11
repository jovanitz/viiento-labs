import type { Meta, StoryObj } from '@storybook/react';
import { ClientsView } from './clients.view';
import { ClientShell } from '../client.shell';
import { defaultVM, emptyVM, manyVM } from './clients.fixtures';
import type { ClientsVM } from './clients.types';

const meta: Meta<typeof ClientsView> = {
  title: 'Bison Manager/Client/Clients',
  component: ClientsView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof ClientsView>;

const inShell = (vm: ClientsVM) =>
  function Render() {
    return (
      <ClientShell active="Clients">
        <ClientsView vm={vm} />
      </ClientShell>
    );
  };

/** The roster — search narrows it, most recent visit and count per client. */
export const Default: Story = { render: inShell(defaultVM) };

/** Nobody served yet. */
export const Empty: Story = { render: inShell(emptyVM) };

/** 200 clients — past one page, the pager (clients.pager.tsx) shows up. */
export const ManyClients: Story = { render: inShell(manyVM) };
