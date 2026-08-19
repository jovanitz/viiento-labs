/**
 * One timeline entry — an icon sitting directly on the rail line, its
 * content beside it. Clicking it expands the entry right there in the
 * timeline (no modal/sheet); an Edit button swaps the expanded area from a
 * read-only field list to the same per-block inputs the picker used to
 * fill in (timeline.fill.field.tsx) — editing happens inline too, never a
 * second modal step.
 */
import { useState } from 'react';
import { FileText, Pencil } from 'lucide-react';
import { Button } from '@acme/ui';
import { TemplateIconBadge } from '../../../templates/identity/templates.icons';
import type { TemplateColor } from '../../../templates/templates.types';
import { FillFormRows } from './fill/timeline.fill.field';
import {
  EntryHeader,
  ExpandedArea,
  Field,
  QuietAction,
} from './timeline.entry.parts';
import { isFillValid, valuesFromFields } from './fill/timeline.fill.logic';
import type { FillValues } from './fill/timeline.fill.logic';
import type { TemplateBlock } from '../../../templates/templates.types';
import type { TimelineEntry } from './timeline.types';

const EntryViewContent = ({
  entry,
  onEdit,
  onOpenDocument,
}: {
  readonly entry: TimelineEntry;
  readonly onEdit: () => void;
  readonly onOpenDocument?: (() => void) | undefined;
}) => (
  <div className="flex flex-col gap-3 px-2 pb-2 pt-3">
    <dl className="flex flex-col gap-3">
      {entry.fields.map((field) => (
        <Field key={field.label} label={field.label} value={field.value} />
      ))}
    </dl>
    {/* Quiet inline actions — the entry's content is the point; these
        surface on intent, not as boxed buttons competing with it. */}
    <div className="flex items-center gap-1">
      <QuietAction onClick={onEdit}>
        <Pencil className="size-3.5" /> Edit
      </QuietAction>
      {/* Issuing lives HERE, not in Templates: a document is a filled
          entry on paper, and only an entry has values. */}
      {onOpenDocument ? (
        <QuietAction onClick={onOpenDocument}>
          <FileText className="size-3.5" /> Document
        </QuietAction>
      ) : null}
    </div>
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
    <FillFormRows blocks={blocks} values={draft} onChange={onChange} />
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
  color,
  expanded,
  onToggle,
  onSaveFields,
  onOpenDocument,
}: {
  readonly entry: TimelineEntry;
  readonly blocks: readonly TemplateBlock[];
  /** The template's accent — the at-a-glance answer to "which form is
   *  this?" when a day mixes entries from several. */
  readonly color: TemplateColor;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly onSaveFields: (values: FillValues) => void;
  readonly onOpenDocument?: (() => void) | undefined;
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
      <TemplateIconBadge
        icon={entry.icon}
        color={color}
        className="relative z-10 size-8"
      />
      <div className="min-w-0 flex-1">
        <EntryHeader entry={entry} expanded={expanded} onClick={onToggle} />
        {expanded && editing ? (
          <ExpandedArea color={color}>
            <EntryEditForm
              blocks={blocks}
              draft={draft}
              onChange={(id, value) => setDraft((d) => ({ ...d, [id]: value }))}
              onCancel={() => setEditing(false)}
              onSave={save}
            />
          </ExpandedArea>
        ) : null}
        {expanded && !editing ? (
          <ExpandedArea color={color}>
            <EntryViewContent
              entry={entry}
              onEdit={startEdit}
              onOpenDocument={onOpenDocument}
            />
          </ExpandedArea>
        ) : null}
      </div>
    </div>
  );
};
