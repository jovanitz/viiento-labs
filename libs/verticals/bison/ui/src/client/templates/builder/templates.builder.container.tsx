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
  TemplateIcon,
} from '../templates.types';

export const TemplateBuilderContainer = ({
  template,
  onCancel,
  onSave,
}: {
  readonly template: EntryTemplate | undefined;
  readonly onCancel: () => void;
  readonly onSave: (template: EntryTemplate) => void;
}) => {
  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [icon, setIcon] = useState<TemplateIcon>(template?.icon ?? 'sparkles');
  const [blocks, setBlocks] = useState<readonly TemplateBlock[]>(
    template?.blocks ?? [],
  );

  const save = () =>
    onSave({
      id: template?.id ?? `tpl-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      icon,
      kind: 'custom',
      blocks,
    });

  return (
    <TemplateBuilderView
      name={name}
      description={description}
      icon={icon}
      blocks={blocks}
      onNameChange={setName}
      onDescriptionChange={setDescription}
      onIconChange={setIcon}
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
    />
  );
};
