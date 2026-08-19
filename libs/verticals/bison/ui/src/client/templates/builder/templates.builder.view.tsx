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
import { BackButton } from '../../back-button';
import { Eye, Pencil } from 'lucide-react';
import { Button, Input, Textarea } from '@acme/ui';
import { BuilderBody } from './templates.builder.body';
import { TemplateIconPicker } from './templates.builder.icon-picker';
import { TemplateColorPicker } from './templates.builder.color-picker';
import type {
  FieldKind,
  TemplateBlock,
  TemplateColor,
  TemplateIcon,
} from '../templates.types';

const HeaderActions = ({
  canSave,
  previewing,
  onSave,
  onTogglePreview,
}: {
  readonly canSave: boolean;
  readonly previewing: boolean;
  readonly onSave: () => void;
  readonly onTogglePreview: () => void;
}) => (
  <div className="flex gap-2">
    {/* Wide screens keep the live preview pinned beside the editor, so
        the toggle only exists where there is no room for both. */}
    <Button
      variant="outline"
      onClick={onTogglePreview}
      className="flex-1 sm:flex-none xl:hidden"
    >
      {previewing ? (
        <>
          <Pencil /> Edit
        </>
      ) : (
        <>
          <Eye /> Preview
        </>
      )}
    </Button>
    <Button
      onClick={onSave}
      disabled={!canSave}
      className="flex-1 sm:flex-none"
    >
      Save template
    </Button>
  </div>
);

const Header = ({
  name,
  description,
  icon,
  color,
  canSave,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onColorChange,
  onCancel,
  onSave,
  previewing,
  onTogglePreview,
}: {
  readonly name: string;
  readonly description: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  readonly canSave: boolean;
  readonly onNameChange: (name: string) => void;
  readonly onDescriptionChange: (description: string) => void;
  readonly onIconChange: (icon: TemplateIcon) => void;
  readonly onColorChange: (color: TemplateColor) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
  readonly previewing: boolean;
  readonly onTogglePreview: () => void;
}) => (
  <div className="flex flex-col gap-3">
    <BackButton label="Templates" onClick={onCancel} />
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
          <TemplateColorPicker color={color} onChange={onColorChange} />
        </div>
      </div>
      <HeaderActions
        canSave={canSave}
        previewing={previewing}
        onSave={onSave}
        onTogglePreview={onTogglePreview}
      />
    </div>
  </div>
);

export const TemplateBuilderView = ({
  name,
  description,
  icon,
  color,
  blocks,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onColorChange,
  onInsertKind,
  onReorder,
  onChangeBlock,
  onRemoveBlock,
  onCancel,
  onSave,
  previewing,
  onTogglePreview,
}: {
  readonly name: string;
  readonly description: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  readonly blocks: readonly TemplateBlock[];
  readonly onNameChange: (name: string) => void;
  readonly onDescriptionChange: (description: string) => void;
  readonly onIconChange: (icon: TemplateIcon) => void;
  readonly onColorChange: (color: TemplateColor) => void;
  readonly onInsertKind: (kind: FieldKind, atIndex: number) => void;
  readonly onReorder: (fromIndex: number, toIndex: number) => void;
  readonly onChangeBlock: (id: string, patch: Partial<TemplateBlock>) => void;
  readonly onRemoveBlock: (id: string) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
  /** Swaps the editor for the as-on-the-timeline preview. */
  readonly previewing: boolean;
  readonly onTogglePreview: () => void;
}) => (
  <div className="flex flex-col gap-6">
    <Header
      name={name}
      description={description}
      icon={icon}
      color={color}
      canSave={name.trim() !== '' && blocks.length > 0}
      onNameChange={onNameChange}
      onDescriptionChange={onDescriptionChange}
      onIconChange={onIconChange}
      onColorChange={onColorChange}
      previewing={previewing}
      onTogglePreview={onTogglePreview}
      onCancel={onCancel}
      onSave={onSave}
    />
    <BuilderBody
      name={name}
      icon={icon}
      color={color}
      blocks={blocks}
      previewing={previewing}
      onInsertKind={onInsertKind}
      onReorder={onReorder}
      onChangeBlock={onChangeBlock}
      onRemoveBlock={onRemoveBlock}
    />
  </div>
);
