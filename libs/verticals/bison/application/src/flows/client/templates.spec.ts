import { describe, expect, it } from 'vitest';
import { ok } from '@acme/shared';
import { findFlowCommand } from '@acme/application';
import type { TemplateDto } from '../../templates/dto';
import type { BisonClientGateway } from '../../client/gateway';
import { loadTemplates } from './templates';
import { BISON_CLIENT_FLOWS } from './registry';

const template: TemplateDto = {
  id: 'tpl-1',
  name: 'Consulta',
  description: '',
  icon: 'stethoscope',
  color: 'teal',
  kind: 'custom',
  blocks: [
    { id: 'motivo', kind: 'short-text', label: 'Motivo', width: 'full' },
  ],
  createdAt: '2026-08-19T12:00:00.000Z',
  updatedAt: '2026-08-19T12:00:00.000Z',
};

/** Only the template surface, recording which mutation ran. */
const fakeGateway = () => {
  const calls: string[] = [];
  const gateway = {
    templates: {
      list: async () => ok([template]),
      get: async () => ok(template),
      create: async (input: { name: string }) => {
        calls.push(`create:${input.name}`);
        return ok(template);
      },
      update: async (input: { id: string }) => {
        calls.push(`update:${input.id}`);
        return ok(template);
      },
    },
  } as unknown as BisonClientGateway;
  return { gateway, calls };
};

describe('bison template flows', () => {
  it('loads the library VM', async () => {
    const { gateway } = fakeGateway();
    const vm = await loadTemplates({ gateway });
    expect(vm.ok).toBe(true);
    if (vm.ok) expect(vm.value.templates).toHaveLength(1);
  });

  it('saveTemplate updates with existingId and creates without', async () => {
    const { gateway, calls } = fakeGateway();
    const save = findFlowCommand(BISON_CLIENT_FLOWS, 'bison.templates.save');
    if (!save) throw new Error('registry entry must exist');

    const base = {
      name: 'Receta',
      description: '',
      icon: 'stethoscope',
      color: 'teal',
      blocks: [
        {
          id: 'motivo',
          kind: 'short-text',
          label: 'Motivo',
          width: 'full',
        },
      ],
    };
    await save.run({ gateway }, save.input.parse(base));
    await save.run(
      { gateway },
      save.input.parse({ ...base, existingId: 'tpl-1' }),
    );
    expect(calls).toEqual(['create:Receta', 'update:tpl-1']);
  });
});
