/** Step 1 of "Add entry" — pick which Template to attach. Presentational
 *  helper of template-picker.dialog.tsx. */
import { LayoutTemplate } from 'lucide-react';
import { TemplateIconGlyph } from '../../../../templates/templates.icons';
import type { EntryTemplate } from '../../../../templates/templates.types';

const TemplateCard = ({
  template,
  onSelect,
}: {
  readonly template: EntryTemplate;
  readonly onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className="flex flex-col items-start gap-2 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <TemplateIconGlyph icon={template.icon} />
    </div>
    <div>
      <p className="text-sm font-medium text-foreground">{template.name}</p>
      <p className="text-xs text-muted-foreground">{template.description}</p>
    </div>
  </button>
);

const ManageTemplatesHint = () => (
  <div className="flex items-start gap-2 rounded-lg border border-dashed border-border p-3 text-muted-foreground">
    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
      <LayoutTemplate className="size-4" />
    </div>
    <p className="text-xs">
      Create or edit templates from{' '}
      <span className="font-medium">Templates</span>.
    </p>
  </div>
);

const Group = ({
  title,
  templates,
  onSelect,
}: {
  readonly title: string;
  readonly templates: readonly EntryTemplate[];
  readonly onSelect: (template: EntryTemplate) => void;
}) =>
  templates.length === 0 ? null : (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelect(template)}
          />
        ))}
      </div>
    </div>
  );

export const TemplatePickerPickStep = ({
  templates,
  onSelect,
}: {
  readonly templates: readonly EntryTemplate[];
  readonly onSelect: (template: EntryTemplate) => void;
}) => {
  const defaults = templates.filter((t) => t.kind === 'default');
  const custom = templates.filter((t) => t.kind === 'custom');
  return (
    <div className="flex flex-col gap-4">
      <Group title="Templates" templates={defaults} onSelect={onSelect} />
      <Group title="Your templates" templates={custom} onSelect={onSelect} />
      <ManageTemplatesHint />
    </div>
  );
};
