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
import { TemplatePreviewView } from './templates.preview.view';
import { TemplateBuilderContainer } from './builder/templates.builder.container';
import type { EntryTemplate } from './templates.types';

type Screen =
  | { readonly kind: 'gallery' }
  | { readonly kind: 'preview'; readonly template: EntryTemplate }
  | { readonly kind: 'builder'; readonly template: EntryTemplate | undefined };

const openTemplate = (template: EntryTemplate): Screen =>
  template.kind === 'default'
    ? { kind: 'preview', template }
    : { kind: 'builder', template };

export const TemplatesContainer = ({
  templates,
  onSaveTemplate,
}: {
  readonly templates: readonly EntryTemplate[];
  readonly onSaveTemplate: (template: EntryTemplate) => void;
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

  if (screen.kind === 'builder')
    return (
      <TemplateBuilderContainer
        template={screen.template}
        onCancel={() => setScreen({ kind: 'gallery' })}
        onSave={save}
      />
    );

  return (
    <TemplatesGalleryView
      templates={templates}
      onSelectTemplate={(template) => setScreen(openTemplate(template))}
      onCreateNew={() => setScreen({ kind: 'builder', template: undefined })}
    />
  );
};
