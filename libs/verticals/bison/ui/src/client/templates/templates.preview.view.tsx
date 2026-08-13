/**
 * Bison Manager · Client · Templates · Preview — a read-only look at a
 * built-in template's schema. Built-in templates ship with the account and
 * aren't editable (only custom ones open the Builder), so this just lists
 * the blocks instead of the full editor chrome.
 *
 * @screen Bison Manager / Client / Templates / Preview
 * @phase draft
 */
import { ArrowLeft } from 'lucide-react';
import { Badge, Button, Stack } from '@acme/ui';
import { TemplateIconGlyph } from './templates.icons';
import { BlockKindGlyph } from './builder/palette/templates.block-icons';
import { STRUCTURAL_KINDS } from './templates.types';
import type { EntryTemplate, TemplateBlock } from './templates.types';

const BlockRow = ({ block }: { readonly block: TemplateBlock }) => {
  if (block.kind === 'section')
    return (
      <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {block.label}
      </p>
    );
  const structural = STRUCTURAL_KINDS.includes(block.kind);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <BlockKindGlyph kind={block.kind} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {block.label}
        </p>
        {block.options ? (
          <p className="truncate text-xs text-muted-foreground">
            {block.options.join(' · ')}
          </p>
        ) : null}
      </div>
      {structural ? null : (
        <Badge variant="outline" appearance="soft">
          {block.required ? 'Required' : 'Optional'}
        </Badge>
      )}
    </div>
  );
};

export const TemplatePreviewView = ({
  template,
  onBack,
}: {
  readonly template: EntryTemplate;
  readonly onBack: () => void;
}) => (
  <Stack gap="group" className="max-w-2xl">
    <Button
      variant="ghost"
      size="sm"
      onClick={onBack}
      className="-ml-2 w-fit text-muted-foreground"
    >
      <ArrowLeft /> Templates
    </Button>
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <TemplateIconGlyph icon={template.icon} className="size-5" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          {template.name}
        </h1>
        <p className="text-sm text-muted-foreground">{template.description}</p>
      </div>
      <Badge variant="secondary" appearance="soft" className="ml-auto">
        Built-in
      </Badge>
    </div>
    <div className="flex flex-col gap-2">
      {template.blocks.map((block) => (
        <BlockRow key={block.id} block={block} />
      ))}
    </div>
  </Stack>
);
