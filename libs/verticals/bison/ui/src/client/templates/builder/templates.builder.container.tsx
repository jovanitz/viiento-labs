/**
 * Template Builder — stateful composition. Owns the draft (name,
 * description, icon, blocks) seeded from an existing custom template or
 * blank for a new one; `.view.tsx` stays a pure function of that draft,
 * same discipline as client-detail.container.tsx.
 */
import { useState } from 'react';
import {
  createBlock,
  insertBlock,
  moveBlock,
  removeBlock,
  updateBlock,
} from './templates.builder.logic';
import { TemplateBuilderView } from './templates.builder.view';
import type {
  EntryTemplate,
  FieldKind,
  TemplateBlock,
  TemplateColor,
  TemplateIcon,
} from '../templates.types';

/** The editable draft, seeded from an existing template or blank. */
const seedDraft = (template: EntryTemplate | undefined) => ({
  name: template?.name ?? '',
  description: template?.description ?? '',
  icon: template?.icon ?? ('sparkles' as TemplateIcon),
  color: template?.color ?? ('gray' as TemplateColor),
});

export const TemplateBuilderContainer = ({
  template,
  onCancel,
  onSave,
}: {
  readonly template: EntryTemplate | undefined;
  readonly onCancel: () => void;
  readonly onSave: (template: EntryTemplate) => void;
}) => {
  const seed = seedDraft(template);
  const [name, setName] = useState(seed.name);
  const [description, setDescription] = useState(seed.description);
  const [icon, setIcon] = useState<TemplateIcon>(seed.icon);
  const [color, setColor] = useState<TemplateColor>(seed.color);
  const [blocks, setBlocks] = useState<readonly TemplateBlock[]>(
    template?.blocks ?? [],
  );
  const [previewing, setPreviewing] = useState(false);

  const save = () =>
    onSave({
      id: template?.id ?? `tpl-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      kind: 'custom',
      blocks,
    });

  return (
    <TemplateBuilderView
      name={name}
      description={description}
      icon={icon}
      color={color}
      blocks={blocks}
      onNameChange={setName}
      onDescriptionChange={setDescription}
      onIconChange={setIcon}
      onColorChange={setColor}
      onInsertKind={(kind: FieldKind, atIndex) =>
        setBlocks((b) => insertBlock(b, createBlock(kind, b), atIndex))
      }
      onReorder={(fromIndex, toIndex) =>
        setBlocks((b) => moveBlock(b, fromIndex, toIndex))
      }
      onChangeBlock={(id, patch) => setBlocks((b) => updateBlock(b, id, patch))}
      onRemoveBlock={(id) => setBlocks((b) => removeBlock(b, id))}
      onCancel={onCancel}
      onSave={save}
      previewing={previewing}
      onTogglePreview={() => setPreviewing((p) => !p)}
    />
  );
};
