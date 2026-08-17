/**
 * Print layout — stateful composition. Seeds its element list from the
 * template's existing `printLayout` (if it designed one before) or starts
 * blank. "Save layout" writes back through the same `onSaveTemplate` the
 * Builder uses and stays on this screen (unlike the Builder's Save, which
 * exits) — designing a print layout is iterative, you keep nudging
 * positions and re-saving, not a one-shot form.
 */
import { useState } from 'react';
import { toast } from '@acme/ui';
import {
  addElement,
  moveElement,
  removeElement,
} from './templates.print.logic';
import { PrintLayoutView } from './templates.print.view';
import type {
  EntryTemplate,
  PrintElement,
  TemplateBlock,
} from '../templates.types';

export const PrintLayoutContainer = ({
  template,
  onBack,
  onSaveTemplate,
}: {
  readonly template: EntryTemplate;
  readonly onBack: () => void;
  readonly onSaveTemplate: (template: EntryTemplate) => void;
}) => {
  const [elements, setElements] = useState<readonly PrintElement[]>(
    template.printLayout?.elements ?? [],
  );

  const addField = (block: TemplateBlock) =>
    setElements((els) => addElement(els, 'field', block.label, block.id));
  const addText = (content: string) =>
    setElements((els) => addElement(els, 'text', content));
  const move = (id: string, x: number, y: number) =>
    setElements((els) => moveElement(els, id, x, y));
  const remove = (id: string) => setElements((els) => removeElement(els, id));

  const save = () => {
    onSaveTemplate({ ...template, printLayout: { elements } });
    toast.success('Print layout saved');
  };

  return (
    <PrintLayoutView
      template={template}
      elements={elements}
      onAddField={addField}
      onAddText={addText}
      onMove={move}
      onRemove={remove}
      onBack={onBack}
      onSave={save}
      onPrint={() => window.print()}
    />
  );
};
