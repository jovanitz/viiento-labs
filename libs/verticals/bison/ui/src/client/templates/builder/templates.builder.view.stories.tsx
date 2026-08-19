import type { Meta, StoryObj } from '@storybook/react';
import { TemplateBuilderView } from './templates.builder.view';
import { ClientShell } from '../../client.shell';
import { TEMPLATES } from '../templates.fixtures';
import type { EntryTemplate } from '../templates.types';

const meta: Meta<typeof TemplateBuilderView> = {
  title: 'Bison Manager/Client/Templates/Builder',
  component: TemplateBuilderView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof TemplateBuilderView>;

const CUSTOM: EntryTemplate =
  TEMPLATES.find((t) => t.kind === 'custom') ?? TEMPLATES[0]!;

const noop = () => undefined;

const render = (over: {
  readonly name?: string;
  readonly description?: string;
  readonly blocks?: EntryTemplate['blocks'];
  readonly previewing?: boolean;
}) => (
  <ClientShell active="Templates">
    <TemplateBuilderView
      name={over.name ?? CUSTOM.name}
      description={over.description ?? CUSTOM.description}
      icon={CUSTOM.icon}
      color={CUSTOM.color}
      blocks={over.blocks ?? CUSTOM.blocks}
      previewing={over.previewing ?? false}
      onNameChange={noop}
      onDescriptionChange={noop}
      onIconChange={noop}
      onColorChange={noop}
      onInsertKind={noop}
      onReorder={noop}
      onChangeBlock={noop}
      onRemoveBlock={noop}
      onCancel={noop}
      onSave={noop}
      onTogglePreview={noop}
    />
  </ClientShell>
);

/** Editing an existing custom template — palette, canvas, and (from xl up)
 *  the as-on-the-timeline preview pinned alongside. */
export const EditingExisting: Story = { render: () => render({}) };

/** A brand-new template: empty draft, Save disabled until it has a name
 *  and at least one block. */
export const NewTemplate: Story = {
  render: () => render({ name: '', description: '', blocks: [] }),
};

/** Below xl the header toggle swaps the editor for the timeline preview —
 *  this is that state. */
export const Previewing: Story = { render: () => render({ previewing: true }) };
