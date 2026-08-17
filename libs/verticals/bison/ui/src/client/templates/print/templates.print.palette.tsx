/** Print layout's palette — click a field (from the template's own capture
 *  schema) or a static text preset to place it on the canvas. Click-to-add
 *  only, no drag source: consistent with the capture Builder's palette,
 *  which added the same affordance specifically so building a form never
 *  depends on a drag succeeding (touch devices can't drag the HTML5 way). */
import { Type } from 'lucide-react';
import { printableBlocks } from './templates.print.logic';
import type { TemplateBlock } from '../templates.types';

const TEXT_PRESETS: readonly string[] = [
  'Business name',
  'Title',
  'Date',
  'Signature',
];

const PaletteButton = ({
  label,
  onClick,
}: {
  readonly label: string;
  readonly onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-md border border-border px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary hover:bg-muted/50"
  >
    {label}
  </button>
);

export const PrintPalette = ({
  blocks,
  onAddField,
  onAddText,
}: {
  readonly blocks: readonly TemplateBlock[];
  readonly onAddField: (block: TemplateBlock) => void;
  readonly onAddText: (content: string) => void;
}) => (
  <div className="flex w-full flex-col gap-4 lg:w-56 lg:shrink-0">
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Fields
      </p>
      <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
        {printableBlocks(blocks).map((block) => (
          <PaletteButton
            key={block.id}
            label={block.label}
            onClick={() => onAddField(block)}
          />
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Text
      </p>
      <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
        {TEXT_PRESETS.map((preset) => (
          <PaletteButton
            key={preset}
            label={preset}
            onClick={() => onAddText(preset)}
          />
        ))}
      </div>
    </div>
    <p className="flex items-start gap-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
      <Type className="size-4 shrink-0" />
      Click to place, then drag on the page to position.
    </p>
  </div>
);
