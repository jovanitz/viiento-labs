import { describe, expect, it } from 'vitest';
import { fixedClock, noopLogger, sequentialIdGenerator } from '@acme/shared';
import type { Template } from '@acme/bison-domain';
import type { TemplateRepository } from './ports';
import { makeTemplateUseCases } from './use-cases';

const inMemoryTemplates = (seed: Template[] = []): TemplateRepository => {
  const store = new Map<string, Template>(seed.map((t) => [t.id, t]));
  return {
    findById: async (id) => store.get(id) ?? null,
    list: async () => [...store.values()],
    save: async (template) => {
      store.set(template.id, template);
    },
  };
};

const deps = (repo: TemplateRepository) => ({
  templates: repo,
  clock: fixedClock(new Date('2026-08-19T12:00:00.000Z')),
  ids: sequentialIdGenerator('tpl'),
  logger: noopLogger,
});

describe('Template use cases', () => {
  it('creates a template, assigning ids to blocks that lack one', async () => {
    const useCases = makeTemplateUseCases(deps(inMemoryTemplates()));
    const created = await useCases.create({
      name: 'Receta',
      description: '',
      icon: 'stethoscope',
      color: 'teal',
      blocks: [
        { kind: 'short-text', label: 'Motivo', width: 'full' },
        {
          id: 'via',
          kind: 'radio',
          label: 'Vía',
          width: 'half',
          options: ['Oral'],
        },
      ],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.kind).toBe('custom');
    expect(created.value.blocks[0]?.id).toBeTruthy();
    expect(created.value.blocks[1]?.id).toBe('via');

    const listed = await useCases.list();
    expect(listed).toHaveLength(1);
  });

  it('propagates schema validation from the domain', async () => {
    const useCases = makeTemplateUseCases(deps(inMemoryTemplates()));
    const created = await useCases.create({
      name: 'Vacía',
      description: '',
      icon: 'file-text',
      color: 'gray',
      blocks: [],
    });
    expect(created.ok).toBe(false);
    if (created.ok) return;
    expect(created.error.tag).toBe('domain/invalid-template-blocks');
  });

  it('updates a custom template and refuses a missing one', async () => {
    const repo = inMemoryTemplates();
    const useCases = makeTemplateUseCases(deps(repo));
    const created = await useCases.create({
      name: 'Receta',
      description: '',
      icon: 'stethoscope',
      color: 'teal',
      blocks: [{ kind: 'short-text', label: 'Motivo', width: 'full' }],
    });
    if (!created.ok) throw new Error('fixture create must succeed');

    const updated = await useCases.update({
      id: created.value.id,
      changes: { name: 'Receta médica' },
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) expect(updated.value.name).toBe('Receta médica');

    const missing = await useCases.update({
      id: 'nope',
      changes: { name: 'x' },
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.tag).toBe('app/template-not-found');
  });

  it('gets a template by id', async () => {
    const useCases = makeTemplateUseCases(deps(inMemoryTemplates()));
    const missing = await useCases.get({ id: 'nope' });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.tag).toBe('app/template-not-found');
  });
});
