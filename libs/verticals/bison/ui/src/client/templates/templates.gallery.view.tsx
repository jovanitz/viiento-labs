/**
 * Bison Manager · Client · Templates — the account's template library, in
 * cards: built-in templates (not editable) and the business's own custom
 * ones. This is what the "Add entry" picker on a client's timeline draws
 * from. Presentational: a pure function of the templates list + actions.
 *
 * @screen Bison Manager / Client / Templates
 * @phase draft
 */
import type { ReactNode } from 'react';
import { Stack } from '@acme/ui';
import { NewTemplateCard, TemplateCard } from './templates.card';
import type { EntryTemplate } from './templates.types';

const Group = ({
  title,
  templates,
  onSelectTemplate,
  trailing,
  emptyHint,
}: {
  readonly title: string;
  readonly templates: readonly EntryTemplate[];
  readonly onSelectTemplate: (template: EntryTemplate) => void;
  readonly trailing?: ReactNode;
  readonly emptyHint?: string;
}) => (
  <div className="flex flex-col gap-2">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {title}
    </p>
    {templates.length === 0 && emptyHint ? (
      <p className="text-sm text-muted-foreground">{emptyHint}</p>
    ) : null}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onSelect={() => onSelectTemplate(template)}
        />
      ))}
      {trailing}
    </div>
  </div>
);

export const TemplatesGalleryView = ({
  templates,
  onSelectTemplate,
  onCreateNew,
}: {
  readonly templates: readonly EntryTemplate[];
  readonly onSelectTemplate: (template: EntryTemplate) => void;
  readonly onCreateNew: () => void;
}) => {
  const defaults = templates.filter((t) => t.kind === 'default');
  const custom = templates.filter((t) => t.kind === 'custom');
  return (
    <Stack gap="group" className="max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Templates</h1>
        <p className="text-sm text-muted-foreground">
          The forms you attach to a client&rsquo;s timeline.
        </p>
      </div>
      <Group
        title="Built-in"
        templates={defaults}
        onSelectTemplate={onSelectTemplate}
      />
      <Group
        title="Your templates"
        templates={custom}
        onSelectTemplate={onSelectTemplate}
        trailing={<NewTemplateCard onClick={onCreateNew} />}
        emptyHint="You haven't created any templates yet — start from scratch below."
      />
    </Stack>
  );
};
