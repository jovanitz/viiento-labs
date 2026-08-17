import type { Meta, StoryObj } from '@storybook/react';
import { ClientDetailView } from './client-detail.view';
import { ClientShell } from '../../client.shell';
import { defaultVM } from '../clients.fixtures';
import { deriveTimelineVM } from './timeline/timeline.logic';
import { SEED_ENTRIES } from './timeline/timeline.fixtures';
import { TEMPLATES } from '../../templates/templates.fixtures';

const meta: Meta<typeof ClientDetailView> = {
  title: 'Bison Manager/Client/Client Detail',
  component: ClientDetailView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof ClientDetailView>;

/** For the full click-through (add entry, open one), see
 *  Bison Manager/Client/Prototype — Navigable. */
export const Default: Story = {
  render: () => (
    <ClientShell active="Clients">
      <ClientDetailView
        client={defaultVM.clients[0]!}
        onBack={() => undefined}
        timelineVM={deriveTimelineVM(SEED_ENTRIES, TEMPLATES)}
        expandedEntryIds={new Set()}
        onAddEntryClick={() => undefined}
        onToggleEntry={() => undefined}
        onSaveEntryFields={() => undefined}
        onSaveIdentity={() => undefined}
        onCycleChannel={() => undefined}
      />
    </ClientShell>
  ),
};
