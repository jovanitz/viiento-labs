/**
 * Templates — stateful composition for the navigable prototype. The
 * template LIST is lifted to client.prototype.tsx (same reasoning as
 * `section`/`accountMode` there) because it's also read from the Clients
 * section's "Add entry" picker — a template saved here must show up there
 * without a page reload. This container only owns which screen shows:
 * gallery, the read-only Preview (built-in templates aren't editable), or
 * the Builder (new or editing a custom template).
 */
import { useState } from 'react';
import { toast } from '@acme/ui';
import { TemplatesGalleryView } from './templates.gallery.view';
import { TemplatePreviewView } from './preview/templates.preview.view';
import { TemplateBuilderContainer } from './builder/templates.builder.container';
import { FormatsPrototype } from './document/formats/formats.prototype';
import { TemplatesSectionTabs } from './templates.tabs';
import type { EntryTemplate } from './templates.types';
import type { DocumentFormat } from './document/document.format';

type Screen =
  | { readonly kind: 'gallery' }
  | { readonly kind: 'preview'; readonly template: EntryTemplate }
  | { readonly kind: 'builder'; readonly template: EntryTemplate | undefined }
  | { readonly kind: 'formats' };

const openTemplate = (template: EntryTemplate): Screen =>
  template.kind === 'default'
    ? { kind: 'preview', template }
    : { kind: 'builder', template };

export const TemplatesContainer = ({
  templates,
  onSaveTemplate,
  formats,
  onSaveFormat,
}: {
  readonly templates: readonly EntryTemplate[];
  readonly onSaveTemplate: (template: EntryTemplate) => void;
  readonly formats: readonly DocumentFormat[];
  readonly onSaveFormat: (format: DocumentFormat) => void;
}) => {
  const [screen, setScreen] = useState<Screen>({ kind: 'gallery' });

  const save = (template: EntryTemplate) => {
    onSaveTemplate(template);
    setScreen({ kind: 'gallery' });
    toast.success(`"${template.name}" saved`);
  };

  if (screen.kind === 'preview')
    return (
      <TemplatePreviewView
        template={screen.template}
        onBack={() => setScreen({ kind: 'gallery' })}
      />
    );

  if (screen.kind === 'formats')
    return (
      <div className="flex flex-col gap-4">
        <TemplatesSectionTabs
          active="formats"
          onChange={(tab) =>
            setScreen({ kind: tab === 'formats' ? 'formats' : 'gallery' })
          }
        />
        <FormatsPrototype
          formats={formats}
          templates={templates}
          onSaveFormat={onSaveFormat}
        />
      </div>
    );

  if (screen.kind === 'builder') {
    const existing = screen.template;
    return (
      <TemplateBuilderContainer
        template={existing}
        onCancel={() => setScreen({ kind: 'gallery' })}
        onSave={save}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TemplatesSectionTabs
        active="templates"
        onChange={(tab) =>
          setScreen({ kind: tab === 'formats' ? 'formats' : 'gallery' })
        }
      />
      <TemplatesGalleryView
        templates={templates}
        onSelectTemplate={(template) => setScreen(openTemplate(template))}
        onCreateNew={() => setScreen({ kind: 'builder', template: undefined })}
      />
    </div>
  );
};
