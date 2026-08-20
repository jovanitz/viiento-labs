import { describe, expect, it } from 'vitest';
import type { TemplateBlock } from './blocks';
import { validateBlocks } from './blocks';
import { createTemplate, makeTemplateId, updateTemplate } from './template';
import type { Template, TemplateId } from './template';

const NOW = '2026-08-19T12:00:00.000Z';

const id = (raw: string): TemplateId => {
  const made = makeTemplateId(raw);
  if (!made.ok) throw new Error('fixture id must be valid');
  return made.value;
};

const block = (over: Partial<TemplateBlock> = {}): TemplateBlock => ({
  id: 'b1',
  kind: 'short-text',
  label: 'Motivo',
  width: 'full',
  ...over,
});

const create = (blocks: readonly TemplateBlock[]) =>
  createTemplate({
    id: id('tpl-1'),
    name: 'Receta',
    description: 'Prescripción simple',
    icon: 'stethoscope',
    color: 'teal',
    blocks,
    occurredAt: NOW,
  });

describe('createTemplate', () => {
  it('creates a custom template with the given schema', () => {
    const result = create([block()]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.kind).toBe('custom');
    expect(result.value.blocks).toHaveLength(1);
    expect(result.value.createdAt).toBe(NOW);
    expect(result.value.updatedAt).toBe(NOW);
  });

  it('rejects an empty name', () => {
    const result = createTemplate({
      id: id('tpl-1'),
      name: '   ',
      description: '',
      icon: 'file-text',
      color: 'gray',
      blocks: [block()],
      occurredAt: NOW,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.tag).toBe('domain/invalid-template-name');
  });
});

describe('validateBlocks', () => {
  it('collects every problem in one error', () => {
    const result = validateBlocks([
      block({ id: 'a', label: '  ' }),
      block({ id: 'a', kind: 'radio' }),
      block({ id: 'c', kind: 'section', required: true }),
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.tag).toBe('domain/invalid-template-blocks');
    const problems = (result.error.details as { problems: string[] }).problems;
    expect(problems).toEqual([
      expect.stringContaining('label must not be empty'),
      expect.stringContaining('duplicate id'),
      expect.stringContaining('radio needs at least one option'),
      expect.stringContaining('section cannot be required'),
    ]);
  });

  it('rejects options on a non-choice kind', () => {
    const result = validateBlocks([block({ options: ['a'] })]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(
      (result.error.details as { problems: string[] }).problems[0],
    ).toContain('must not carry options');
  });

  it('requires at least one data-capturing block', () => {
    const result = validateBlocks([block({ kind: 'section', label: 'Datos' })]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect((result.error.details as { problems: string[] }).problems).toContain(
      'a template needs at least one data-capturing block',
    );
  });

  it('accepts a well-formed schema', () => {
    const result = validateBlocks([
      block({ id: 's', kind: 'section', label: 'Datos' }),
      block({ id: 'a', kind: 'radio', options: ['Sí', 'No'] }),
      block({ id: 'b', kind: 'file', label: 'Estudio' }),
    ]);
    expect(result.ok).toBe(true);
  });
});

describe('updateTemplate', () => {
  const existing = (): Template => {
    const made = create([block()]);
    if (!made.ok) throw new Error('fixture template must be valid');
    return made.value;
  };

  it('applies changes and bumps updatedAt', () => {
    const later = '2026-08-20T09:00:00.000Z';
    const result = updateTemplate(
      existing(),
      { name: 'Receta médica', color: 'violet' },
      later,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe('Receta médica');
    expect(result.value.color).toBe('violet');
    expect(result.value.createdAt).toBe(NOW);
    expect(result.value.updatedAt).toBe(later);
  });

  it('refuses to edit a default template', () => {
    const template: Template = { ...existing(), kind: 'default' };
    const result = updateTemplate(template, { name: 'Otro' }, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.tag).toBe('domain/template-not-editable');
  });

  it('validates the replacement schema', () => {
    const result = updateTemplate(existing(), { blocks: [] }, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.tag).toBe('domain/invalid-template-blocks');
  });
});
