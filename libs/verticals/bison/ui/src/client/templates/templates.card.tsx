/** One template card in the gallery — identity, field count, and (for
 *  custom templates) a "Custom" badge. Presentational helper of
 *  templates.gallery.view.tsx. */
import { Plus } from 'lucide-react';
import { Badge, Card } from '@acme/ui';
import { TemplateIconGlyph } from './templates.icons';
import { STRUCTURAL_KINDS } from './templates.types';
import type { EntryTemplate } from './templates.types';

const fieldCount = (template: EntryTemplate) =>
  template.blocks.filter((b) => !STRUCTURAL_KINDS.includes(b.kind)).length;

export const TemplateCard = ({
  template,
  onSelect,
}: {
  readonly template: EntryTemplate;
  readonly onSelect: () => void;
}) => {
  const count = fieldCount(template);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="flex h-full flex-col gap-3 p-4 transition-colors hover:border-primary hover:bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <TemplateIconGlyph icon={template.icon} className="size-5" />
          </div>
          {template.kind === 'custom' ? (
            <Badge variant="secondary" appearance="soft">
              Custom
            </Badge>
          ) : null}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{template.name}</p>
          <p className="text-xs text-muted-foreground">
            {template.description}
          </p>
        </div>
        <p className="mt-auto text-xs tabular-nums text-muted-foreground">
          {count} field{count === 1 ? '' : 's'}
        </p>
      </Card>
    </button>
  );
};

export const NewTemplateCard = ({
  onClick,
}: {
  readonly onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <Card className="flex h-full min-h-[132px] flex-col items-center justify-center gap-2 border-dashed p-4 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
      <Plus className="size-5" />
      <p className="text-sm font-medium">New template</p>
    </Card>
  </button>
);
