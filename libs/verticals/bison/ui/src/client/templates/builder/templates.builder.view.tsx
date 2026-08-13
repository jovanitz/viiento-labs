/**
 * Bison Manager · Client · Templates · Builder — build a template's
 * capture schema: drag blocks in from the palette, reorder them, group
 * with Sections. Presentational: a pure function of the draft + actions
 * (same discipline as clients.view.tsx); templates.builder.container owns
 * the actual state.
 *
 * @screen Bison Manager / Client / Templates / Builder
 * @phase draft
 */
import { ArrowLeft } from 'lucide-react';
import { Button, Input, Textarea } from '@acme/ui';
import { BuilderPalette } from './palette/templates.builder.palette';
import { BuilderCanvas } from './canvas/templates.builder.canvas';
import { TemplateIconPicker } from './templates.builder.icon-picker';
import type {
  FieldKind,
  TemplateBlock,
  TemplateIcon,
} from '../templates.types';

const Header = ({
  name,
  description,
  icon,
  canSave,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onCancel,
  onSave,
}: {
  readonly name: string;
  readonly description: string;
  readonly icon: TemplateIcon;
  readonly canSave: boolean;
  readonly onNameChange: (name: string) => void;
  readonly onDescriptionChange: (description: string) => void;
  readonly onIconChange: (icon: TemplateIcon) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}) => (
  <div className="flex flex-col gap-3">
    <Button
      variant="ghost"
      size="sm"
      onClick={onCancel}
      className="-ml-2 w-fit text-muted-foreground"
    >
      <ArrowLeft /> Templates
    </Button>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex flex-1 items-start gap-3">
        <TemplateIconPicker icon={icon} onChange={onIconChange} />
        <div className="flex flex-1 flex-col gap-2">
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Template name"
            className="text-base font-medium"
            aria-label="Template name"
          />
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="What's this template for?"
            className="min-h-0 resize-none text-sm"
            rows={1}
            aria-label="Template description"
          />
        </div>
      </div>
      <Button onClick={onSave} disabled={!canSave} className="w-full sm:w-auto">
        Save template
      </Button>
    </div>
  </div>
);

export const TemplateBuilderView = ({
  name,
  description,
  icon,
  blocks,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onInsertKind,
  onReorder,
  onChangeBlock,
  onRemoveBlock,
  onCancel,
  onSave,
}: {
  readonly name: string;
  readonly description: string;
  readonly icon: TemplateIcon;
  readonly blocks: readonly TemplateBlock[];
  readonly onNameChange: (name: string) => void;
  readonly onDescriptionChange: (description: string) => void;
  readonly onIconChange: (icon: TemplateIcon) => void;
  readonly onInsertKind: (kind: FieldKind, atIndex: number) => void;
  readonly onReorder: (fromIndex: number, toIndex: number) => void;
  readonly onChangeBlock: (id: string, patch: Partial<TemplateBlock>) => void;
  readonly onRemoveBlock: (id: string) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}) => (
  <div className="flex flex-col gap-6">
    <Header
      name={name}
      description={description}
      icon={icon}
      canSave={name.trim() !== '' && blocks.length > 0}
      onNameChange={onNameChange}
      onDescriptionChange={onDescriptionChange}
      onIconChange={onIconChange}
      onCancel={onCancel}
      onSave={onSave}
    />
    <div className="flex flex-col gap-6 lg:flex-row">
      <BuilderPalette
        onAddBlock={(kind) => onInsertKind(kind, blocks.length)}
      />
      <BuilderCanvas
        blocks={blocks}
        onInsertKind={(kind, atIndex) =>
          onInsertKind(kind as FieldKind, atIndex)
        }
        onReorder={onReorder}
        onChangeBlock={onChangeBlock}
        onRemoveBlock={onRemoveBlock}
      />
    </div>
  </div>
);
