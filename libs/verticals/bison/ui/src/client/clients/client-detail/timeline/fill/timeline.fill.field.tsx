/**
 * One input for filling in a template Block — which control renders
 * depends on the block's kind. Section/Help text are structural (no
 * input); everything else reads/writes a single string value, even
 * choice kinds (checkboxes join selections with ", "). Used to fill a
 * newly-attached entry inline in the timeline (timeline.entry.tsx).
 */
import {
  Checkbox,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@acme/ui';
import { FileInput } from './timeline.fill.file';
import { fillRows } from './timeline.fill.logic';
import type { TemplateBlock } from '../../../../templates/templates.types';

const toggleOption = (
  selected: readonly string[],
  option: string,
): readonly string[] =>
  selected.includes(option)
    ? selected.filter((o) => o !== option)
    : [...selected, option];

const ChoiceInput = ({
  block,
  value,
  onChange,
}: {
  readonly block: TemplateBlock;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) => {
  const options = block.options ?? [];
  if (block.kind === 'radio')
    return (
      <RadioGroup value={value} onValueChange={onChange}>
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <RadioGroupItem value={option} /> {option}
          </label>
        ))}
      </RadioGroup>
    );
  if (block.kind === 'select')
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose one…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  const selected = value ? value.split(', ') : [];
  return (
    <div className="flex flex-col gap-1.5">
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <Checkbox
            checked={selected.includes(option)}
            onCheckedChange={() =>
              onChange(toggleOption(selected, option).join(', '))
            }
          />
          {option}
        </label>
      ))}
    </div>
  );
};

type TextLikeProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
};

/** short-text/number/date/time are all a plain `<Input>` that only
 *  differs by `type` — one config table instead of a branch per kind.
 *  `file` left this table for a real picker (timeline.fill.file.tsx). */
const TEXT_LIKE_INPUT: Partial<
  Record<TemplateBlock['kind'], { type?: string; placeholder?: string }>
> = {
  number: { type: 'number' },
  date: { type: 'date' },
  time: { type: 'time' },
};

const LongTextInput = ({ value, onChange }: TextLikeProps) => (
  <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
);

const SignatureInput = ({ value, onChange }: TextLikeProps) => (
  <label className="flex items-center gap-2 text-sm text-foreground">
    <Switch
      checked={value === 'Signed'}
      onCheckedChange={(checked) => onChange(checked ? 'Signed' : '')}
    />
    {value === 'Signed' ? 'Signed' : 'Tap to sign'}
  </label>
);

const YesNoInput = ({ value, onChange }: TextLikeProps) => (
  <Switch
    checked={value === 'Yes'}
    onCheckedChange={(checked) => onChange(checked ? 'Yes' : 'No')}
  />
);

const FieldInput = ({
  block,
  value,
  onChange,
}: {
  readonly block: TemplateBlock;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) => {
  if (block.kind === 'file')
    return <FileInput value={value} onChange={onChange} />;
  if (block.kind === 'long-text')
    return <LongTextInput value={value} onChange={onChange} />;
  if (block.kind === 'signature')
    return <SignatureInput value={value} onChange={onChange} />;
  if (block.kind === 'switch')
    return <YesNoInput value={value} onChange={onChange} />;
  if (
    block.kind === 'radio' ||
    block.kind === 'select' ||
    block.kind === 'checkboxes'
  )
    return <ChoiceInput block={block} value={value} onChange={onChange} />;
  const config = TEXT_LIKE_INPUT[block.kind];
  return (
    <Input
      type={config?.type}
      placeholder={config?.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export const TemplateFillField = ({
  block,
  value,
  onChange,
}: {
  readonly block: TemplateBlock;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) => {
  if (block.kind === 'section')
    return (
      <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {block.label}
      </p>
    );
  if (block.kind === 'help-text')
    return <p className="text-sm text-muted-foreground">{block.label}</p>;
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {block.label}
        {block.required ? ' *' : ''}
      </Label>
      <FieldInput block={block} value={value} onChange={onChange} />
    </div>
  );
};

/** Shared rows share the width evenly — same split the printed page uses. */
const ROW_GRID: Record<number, string> = {
  2: 'grid grid-cols-2 gap-3',
  3: 'grid grid-cols-3 gap-3',
};

/**
 * The fill form's rows: same-width neighbours share a line (fillRows, the
 * same rule the printed page uses), everything else stacks. One component
 * so the timeline's edit form and the builder's preview cannot render
 * capture differently.
 */
export const FillFormRows = ({
  blocks,
  values,
  onChange,
}: {
  readonly blocks: readonly TemplateBlock[];
  readonly values: Readonly<Record<string, string>>;
  readonly onChange: (blockId: string, value: string) => void;
}) => (
  <>
    {fillRows(blocks).map((row) => (
      <div key={row[0]?.id} className={ROW_GRID[row.length] ?? undefined}>
        {row.map((block) => (
          <TemplateFillField
            key={block.id}
            block={block}
            value={values[block.id] ?? ''}
            onChange={(value) => onChange(block.id, value)}
          />
        ))}
      </div>
    ))}
  </>
);
