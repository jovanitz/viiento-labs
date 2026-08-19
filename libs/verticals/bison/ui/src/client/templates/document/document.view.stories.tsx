import type { Meta, StoryObj } from '@storybook/react';
import { DocumentPreviewView } from './document.view';
import { DocumentPageSurface } from './render/document.page';
import { ClientShell } from '../../client.shell';
import { documentPreview } from './document.compose';
import { SHIPPED_FORMATS } from './document.format';
import type { DocumentFormat } from './document.format';
import { sampleValues } from './fixtures/document.samples';
import { EMPTY_ACCOUNT, PLACEHOLDER_TOKENS } from './document.tokens';
import type { TokenValues } from './document.tokens';
import { DOCUMENT_THEMES } from './document.themes';
import { TEMPLATES } from '../templates.fixtures';
import type { EntryTemplate } from '../templates.types';

const meta: Meta<typeof DocumentPreviewView> = {
  title: 'Bison Manager/Client/Templates/Document',
  component: DocumentPreviewView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof DocumentPreviewView>;

/** The richest template gives the preview an honest body. */
const TEMPLATE: EntryTemplate = [...TEMPLATES].sort(
  (a, b) => b.blocks.length - a.blocks.length,
)[0]!;
const FORMAT: DocumentFormat = SHIPPED_FORMATS[0]!;

const preview = (
  format: DocumentFormat,
  sample: 'typical' | 'stress' = 'typical',
  tokens: TokenValues = PLACEHOLDER_TOKENS,
) =>
  documentPreview({
    format,
    template: TEMPLATE,
    values: sampleValues(TEMPLATE, sample),
    tokens,
    sample,
  });

const shell = (vm: ReturnType<typeof preview>) => (
  <ClientShell active="Templates">
    <DocumentPreviewView vm={vm} onSampleChange={() => undefined} />
  </ClientShell>
);

/** A template wrapped in a shipped format. The body is the capture schema
 *  itself — same order, `half` fields paired — and the sample values are
 *  generated from each block's kind, never authored. */
export const WrappedInFormat: Story = { render: () => shell(preview(FORMAT)) };

/** Identical content under all four shipped themes — the aesthetic floor
 *  is ours, the business only picks. */
export const AllThemes: Story = {
  render: () => (
    <ClientShell active="Templates">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DOCUMENT_THEMES.map((theme) => {
          const vm = preview({ ...FORMAT, themeId: theme.id });
          const page = vm.document.pages[0];
          return (
            <div key={theme.id} className="flex shrink-0 flex-col gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {theme.name}
                </p>
                <p className="text-xs text-muted-foreground">{theme.blurb}</p>
              </div>
              {page ? (
                <DocumentPageSurface
                  doc={vm.document}
                  page={page}
                  pageIndex={0}
                  pageCount={1}
                  scale={0.46}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </ClientShell>
  ),
};

/** The case that actually breaks layouts: the longest value each field can
 *  plausibly hold. */
export const LongestValues: Story = {
  render: () => shell(preview(FORMAT, 'stress')),
};

/** An account that has not filled its details in yet — the letterhead
 *  simply does not print (owner's call): the app never invents an
 *  identity to fill the gap. */
export const NoAccountDetails: Story = {
  render: () => shell(preview(FORMAT, 'typical', EMPTY_ACCOUNT)),
};
