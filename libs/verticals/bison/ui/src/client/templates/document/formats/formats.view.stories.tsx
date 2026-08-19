import type { Meta, StoryObj } from '@storybook/react';
import { FormatsView } from './formats.view';
import { ClientShell } from '../../../client.shell';
import { documentPreview } from '../document.compose';
import { SHIPPED_FORMATS } from '../document.format';
import { DOCUMENT_THEMES } from '../document.themes';
import { PLACEHOLDER_TOKENS } from '../document.tokens';
import { sampleValues } from '../fixtures/document.samples';
import { TEMPLATES } from '../../templates.fixtures';
import type { FormatsActions } from './formats.view';

const meta: Meta<typeof FormatsView> = {
  title: 'Bison Manager/Client/Templates/Formats',
  component: FormatsView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof FormatsView>;

const noop = () => undefined;
const ACTIONS: FormatsActions = {
  onSelect: noop,
  onThemeChange: noop,
  onToggleHeaderToken: noop,
  onToggleFooterToken: noop,
  onToggleMark: noop,
  onSampleChange: noop,
};

/** The richest template gives the preview an honest body. */
const TEMPLATE = [...TEMPLATES].sort(
  (a, b) => b.blocks.length - a.blocks.length,
)[0]!;

const render = (index: number) => {
  const selected = SHIPPED_FORMATS[index] ?? SHIPPED_FORMATS[0]!;
  return (
    <ClientShell active="Templates">
      <FormatsView
        formats={SHIPPED_FORMATS}
        selected={selected}
        themes={DOCUMENT_THEMES}
        preview={documentPreview({
          format: selected,
          template: TEMPLATE,
          values: sampleValues(TEMPLATE, 'typical'),
          tokens: PLACEHOLDER_TOKENS,
          sample: 'typical',
        })}
        actions={ACTIONS}
      />
    </ClientShell>
  );
};

/** The shipped catalog with the first format selected — full letterhead,
 *  marks on, clinical theme. */
export const Default: Story = { render: () => render(0) };

/** A leaner wrapper: half-letter, minimal theme, one mark. */
export const Instructions: Story = { render: () => render(1) };
