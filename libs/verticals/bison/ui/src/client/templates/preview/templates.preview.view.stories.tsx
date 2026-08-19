import type { Meta, StoryObj } from '@storybook/react';
import { TemplatePreviewView } from './templates.preview.view';
import { ClientShell } from '../../client.shell';
import { TEMPLATES } from '../templates.fixtures';

const meta: Meta<typeof TemplatePreviewView> = {
  title: 'Bison Manager/Client/Templates/Preview',
  component: TemplatePreviewView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof TemplatePreviewView>;

const at = (index: number) => (
  <ClientShell active="Templates">
    <TemplatePreviewView
      template={TEMPLATES[index] ?? TEMPLATES[0]!}
      onBack={() => undefined}
    />
  </ClientShell>
);

/** A structured built-in template: sections, required badges, the accent
 *  identity in the header. */
export const StructuredRecord: Story = { render: () => at(1) };

/** The single-field case — the list stays intentional, not sparse. */
export const SingleField: Story = { render: () => at(0) };
