import { useEffect, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button, EmptyState, toast } from '@acme/ui';
import { useStore, useTemplatesStore } from '../../store/hooks';
import { TemplatesContainer } from '../templates.container';
import type { EntryTemplate } from '../templates.types';
import {
  SHIPPED_FORMATS,
  upsertFormat,
} from '../document/document.format';
import type { DocumentFormat } from '../document/document.format';

/**
 * The DI-bound Templates section — the library comes from the store
 * (flows → `bison.*` gateway) and the Builder's save persists through it:
 * update when the edited template exists in the backend list, create
 * otherwise (the Builder's local id is never sent — block ids are).
 * `TemplatesContainer` and every view under it stay untouched.
 *
 * Formats (ADR-0021 document wrappers) have no backend yet — they stay
 * session-local, seeded with the shipped catalog.
 */
export const TemplatesSectionContainer = () => {
  const store = useTemplatesStore();
  const vm = useStore(store, (s) => s.vm);
  const error = useStore(store, (s) => s.error);
  const [formats, setFormats] =
    useState<readonly DocumentFormat[]>(SHIPPED_FORMATS);

  useEffect(() => {
    void store.getState().load();
  }, [store]);

  if (!vm) {
    return error ? (
      <EmptyState
        icon={<CircleAlert />}
        title="Couldn't load templates"
        description={error}
        action={
          <Button size="sm" onClick={() => void store.getState().load()}>
            Retry
          </Button>
        }
      />
    ) : (
      <p className="text-sm text-muted-foreground">Loading templates…</p>
    );
  }

  const templates = vm.templates as readonly EntryTemplate[];

  const save = async (template: EntryTemplate) => {
    const exists = vm.templates.some((t) => t.id === template.id);
    const saved = await store.getState().save({
      existingId: exists ? template.id : undefined,
      name: template.name,
      description: template.description,
      icon: template.icon,
      color: template.color,
      blocks: template.blocks,
    });
    if (!saved) toast.error("The template couldn't be saved — try again.");
  };

  return (
    <TemplatesContainer
      templates={templates}
      onSaveTemplate={(template) => void save(template)}
      formats={formats}
      onSaveFormat={(format) => setFormats((fs) => upsertFormat(fs, format))}
    />
  );
};
