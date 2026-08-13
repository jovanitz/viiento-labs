import type { Meta, StoryObj } from '@storybook/react';
import { TemplatesGalleryView } from './templates.gallery.view';
import { ClientShell } from '../client.shell';
import { TEMPLATES } from './templates.fixtures';

const meta: Meta<typeof TemplatesGalleryView> = {
  title: 'Bison Manager/Client/Templates',
  component: TemplatesGalleryView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof TemplatesGalleryView>;

/** Built-in templates plus the business's own. */
export const Default: Story = {
  render: () => (
    <ClientShell active="Templates">
      <TemplatesGalleryView
        templates={TEMPLATES}
        onSelectTemplate={() => undefined}
        onCreateNew={() => undefined}
      />
    </ClientShell>
  ),
};
