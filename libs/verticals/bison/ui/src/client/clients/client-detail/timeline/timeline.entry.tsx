/**
 * One timeline entry — an icon sitting directly on the rail line, its
 * content beside it. Clicking it expands the entry right there in the
 * timeline (no modal/sheet); an Edit button swaps the expanded area from a
 * read-only field list to the same per-block inputs the picker used to
 * fill in (timeline.fill.field.tsx) — editing happens inline too, never a
 * second modal step.
 */
import { useState } from 'react';
import { ChevronDown, Pencil } from 'lucide-react';
import { Button, cn } from '@acme/ui';
import { TemplateIconGlyph } from '../../../templates/templates.icons';
import { TemplateFillField } from './timeline.fill.field';
import { isFillValid, valuesFromFields } from './timeline.fill.logic';
import type { FillValues } from './timeline.fill.logic';
import type { TemplateBlock } from '../../../templates/templates.types';
import type { TimelineEntry } from './timeline.types';

const Field = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="text-sm text-foreground">{value}</dd>
  </div>
);

const EntryHeader = ({
  entry,
  expanded,
  onClick,
}: {
  readonly entry: TimelineEntry;
  readonly expanded: boolean;
  readonly onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={expanded}
    className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-foreground">
          {entry.templateName}
        </p>
        <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {entry.timeLabel}
        </p>
      </div>
      <p className="truncate text-sm text-muted-foreground">{entry.summary}</p>
    </div>
    <ChevronDown
      className={cn(
        'size-4 shrink-0 text-muted-foreground transition-transform',
        expanded && 'rotate-180',
      )}
    />
  </button>
);

const EntryViewContent = ({
  entry,
  onEdit,
}: {
  readonly entry: TimelineEntry;
  readonly onEdit: () => void;
}) => (
  <div className="flex flex-col gap-3 px-2 pb-2 pt-3">
    <dl className="flex flex-col gap-3">
      {entry.fields.map((field) => (
        <Field key={field.label} label={field.label} value={field.value} />
      ))}
    </dl>
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-fit"
      onClick={onEdit}
    >
      <Pencil /> Edit
    </Button>
  </div>
);

const EntryEditForm = ({
  blocks,
  draft,
  onChange,
  onCancel,
  onSave,
}: {
  readonly blocks: readonly TemplateBlock[];
  readonly draft: FillValues;
  readonly onChange: (blockId: string, value: string) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}) => (
  <div className="flex flex-col gap-3 px-2 pb-2 pt-3">
    {blocks.map((block) => (
      <TemplateFillField
        key={block.id}
        block={block}
        value={draft[block.id] ?? ''}
        onChange={(value) => onChange(block.id, value)}
      />
    ))}
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        onClick={onSave}
        disabled={!isFillValid(blocks, draft)}
      >
        Save
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  </div>
);

export const EntryRow = ({
  entry,
  blocks,
  expanded,
  onToggle,
  onSaveFields,
}: {
  readonly entry: TimelineEntry;
  readonly blocks: readonly TemplateBlock[];
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly onSaveFields: (values: FillValues) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FillValues>({});

  const startEdit = () => {
    setDraft(valuesFromFields(blocks, entry.fields));
    setEditing(true);
  };

  const save = () => {
    onSaveFields(draft);
    setEditing(false);
  };

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <TemplateIconGlyph icon={entry.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <EntryHeader entry={entry} expanded={expanded} onClick={onToggle} />
        {expanded && editing ? (
          <EntryEditForm
            blocks={blocks}
            draft={draft}
            onChange={(id, value) => setDraft((d) => ({ ...d, [id]: value }))}
            onCancel={() => setEditing(false)}
            onSave={save}
          />
        ) : null}
        {expanded && !editing ? (
          <EntryViewContent entry={entry} onEdit={startEdit} />
        ) : null}
      </div>
    </div>
  );
};
