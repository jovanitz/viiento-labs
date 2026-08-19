/**
 * Prototype-only composition for Formats: edits go straight through
 * `onSaveFormat` (the account's format list lives in client.prototype.tsx,
 * lifted like templates are) so a tweak here is immediately what the
 * Timeline's Document screen offers.
 *
 * Not a `*.container.tsx`: nothing real is wired, the view is
 * `@phase draft`.
 */
import { useState } from 'react';
import { FormatsView } from './formats.view';
import { documentPreview } from '../document.compose';
import { toggleMark, toggleToken } from '../document.format';
import type { DocumentFormat } from '../document.format';
import { DOCUMENT_THEMES } from '../document.themes';
import { PLACEHOLDER_TOKENS } from '../document.tokens';
import { sampleValues } from '../fixtures/document.samples';
import type { EntryTemplate } from '../../templates.types';

export const FormatsPrototype = ({
  formats,
  templates,
  onSaveFormat,
}: {
  readonly formats: readonly DocumentFormat[];
  readonly templates: readonly EntryTemplate[];
  readonly onSaveFormat: (format: DocumentFormat) => void;
}) => {
  const [selectedId, setSelectedId] = useState(formats[0]?.id ?? '');
  const [sample, setSample] = useState<'typical' | 'stress'>('typical');
  const selected = formats.find((f) => f.id === selectedId) ?? formats[0];
  // The richest template makes the most honest preview body — judging a
  // wrapper needs enough content inside it.
  const previewTemplate = [...templates].sort(
    (a, b) => b.blocks.length - a.blocks.length,
  )[0];
  if (!selected || !previewTemplate) return null;

  const save = (format: DocumentFormat) => onSaveFormat(format);

  return (
    <FormatsView
      formats={formats}
      selected={selected}
      themes={DOCUMENT_THEMES}
      preview={documentPreview({
        format: selected,
        template: previewTemplate,
        values: sampleValues(previewTemplate, sample),
        tokens: PLACEHOLDER_TOKENS,
        sample,
      })}
      actions={{
        onSelect: setSelectedId,
        onSampleChange: setSample,
        onThemeChange: (themeId) => save({ ...selected, themeId }),
        onToggleHeaderToken: (token) =>
          save({
            ...selected,
            headerTokens: toggleToken(selected.headerTokens, token),
          }),
        onToggleFooterToken: (token) =>
          save({
            ...selected,
            footerTokens: toggleToken(selected.footerTokens, token),
          }),
        onToggleMark: (asset) =>
          save({ ...selected, marks: toggleMark(selected.marks, asset) }),
      }}
    />
  );
};
