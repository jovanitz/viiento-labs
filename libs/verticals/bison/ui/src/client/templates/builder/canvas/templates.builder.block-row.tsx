/**
 * One block in the Builder canvas — a compact inline editor: label,
 * required + width toggles (skipped for structural kinds — a Section or
 * Help text is never "required" or half-width), an options editor for
 * choice kinds, a drag handle to reorder, and delete. The drag handle is
 * the only draggable part of the row (not the whole row) so grabbing text
 * inside the label/option inputs still selects text instead of dragging.
 */
import type { DragEvent } from 'react';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import {
  Button,
  Input,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@acme/ui';
import { BlockKindGlyph } from '../palette/templates.block-icons';
import { CHOICE_KINDS, STRUCTURAL_KINDS } from '../../templates.types';
import type { FieldWidth, TemplateBlock } from '../../templates.types';

const OptionsEditor = ({
  options,
  onChange,
}: {
  readonly options: readonly string[];
  readonly onChange: (options: readonly string[]) => void;
}) => (
  <div className="flex flex-col gap-1.5">
    {options.map((option, i) => (
      <div key={i} className="flex items-center gap-1.5">
        <Input
          value={option}
          onChange={(e) =>
            onChange(options.map((o, j) => (j === i ? e.target.value : o)))
          }
          className="h-8 text-sm"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => onChange(options.filter((_, j) => j !== i))}
          disabled={options.length <= 1}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    ))}
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-fit"
      onClick={() => onChange([...options, `Option ${options.length + 1}`])}
    >
      <Plus /> Add option
    </Button>
  </div>
);

const RowHeader = ({
  block,
  structural,
  onChange,
  onRemove,
}: {
  readonly block: TemplateBlock;
  readonly structural: boolean;
  readonly onChange: (patch: Partial<TemplateBlock>) => void;
  readonly onRemove: () => void;
}) => (
  <div className="flex items-center gap-2">
    <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
      <BlockKindGlyph kind={block.kind} className="size-3.5" />
    </div>
    <Input
      value={block.label}
      onChange={(e) => onChange({ label: e.target.value })}
      className="h-8 flex-1 text-sm font-medium"
      aria-label={structural ? 'Text' : 'Label'}
    />
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
      onClick={onRemove}
    >
      <Trash2 className="size-4" />
    </Button>
  </div>
);

const RowSettings = ({
  block,
  onChange,
}: {
  readonly block: TemplateBlock;
  readonly onChange: (patch: Partial<TemplateBlock>) => void;
}) => (
  <div className="flex items-center justify-between gap-2 pt-1">
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <Switch
        checked={block.required ?? false}
        onCheckedChange={(required) => onChange({ required })}
      />
      Required
    </label>
    <ToggleGroup
      type="single"
      value={block.width}
      onValueChange={(v) => v && onChange({ width: v as FieldWidth })}
    >
      <ToggleGroupItem value="full" size="sm">
        Full
      </ToggleGroupItem>
      <ToggleGroupItem value="half" size="sm">
        Half
      </ToggleGroupItem>
    </ToggleGroup>
  </div>
);

export const BuilderBlockRow = ({
  block,
  dragOver,
  onRowDragOver,
  onRowDrop,
  onHandleDragStart,
  onHandleDragEnd,
  onChange,
  onRemove,
}: {
  readonly block: TemplateBlock;
  readonly dragOver: boolean;
  readonly onRowDragOver: (e: DragEvent<HTMLLIElement>) => void;
  readonly onRowDrop: (e: DragEvent<HTMLLIElement>) => void;
  readonly onHandleDragStart: (e: DragEvent<HTMLButtonElement>) => void;
  readonly onHandleDragEnd: () => void;
  readonly onChange: (patch: Partial<TemplateBlock>) => void;
  readonly onRemove: () => void;
}) => {
  const structural = STRUCTURAL_KINDS.includes(block.kind);
  const choice = CHOICE_KINDS.includes(block.kind);
  return (
    <li
      onDragOver={onRowDragOver}
      onDrop={onRowDrop}
      className={cn(
        'flex gap-2 rounded-md border border-transparent pt-2',
        dragOver && 'border-t-primary',
      )}
    >
      <button
        type="button"
        draggable
        onDragStart={onHandleDragStart}
        onDragEnd={onHandleDragEnd}
        aria-label="Reorder"
        className="mt-2.5 flex size-6 shrink-0 cursor-grab items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex flex-1 flex-col gap-2 rounded-lg border border-border p-3">
        <RowHeader
          block={block}
          structural={structural}
          onChange={onChange}
          onRemove={onRemove}
        />
        {choice ? (
          <OptionsEditor
            options={block.options ?? []}
            onChange={(options) => onChange({ options })}
          />
        ) : null}
        {structural ? null : <RowSettings block={block} onChange={onChange} />}
      </div>
    </li>
  );
};
