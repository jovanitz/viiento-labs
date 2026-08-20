import {
  type Clock,
  type IdGenerator,
  type Logger,
  type Result,
  err,
  ok,
} from '@acme/shared';
import {
  createTemplate,
  makeTemplateId,
  updateTemplate,
} from '@acme/bison-domain';
import type {
  TemplateBlock,
  TemplateChanges,
  TemplateColor,
  TemplateIcon,
} from '@acme/bison-domain';
import { type TemplateDto, toTemplateDto } from './dto';
import { type TemplateUseCaseError, templateNotFound } from './errors';
import type { TemplateRepository } from './ports';

export type TemplateUseCaseDeps = {
  readonly templates: TemplateRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly logger: Logger;
};

export type TemplateUseCaseResult = Promise<
  Result<TemplateDto, TemplateUseCaseError>
>;

/** A block as the builder submits it — id optional so a caller that never
 *  rendered the form (the conversational interface) can omit it. */
export type TemplateBlockInput = Omit<TemplateBlock, 'id'> & {
  readonly id?: string;
};

const withIds = (
  blocks: readonly TemplateBlockInput[],
  ids: IdGenerator,
): readonly TemplateBlock[] =>
  blocks.map((block) => {
    const { id, ...rest } = block;
    return { id: id ?? ids.next(), ...rest };
  });

export const makeCreateTemplate =
  (deps: TemplateUseCaseDeps) =>
  async (input: {
    readonly name: string;
    readonly description: string;
    readonly icon: TemplateIcon;
    readonly color: TemplateColor;
    readonly blocks: readonly TemplateBlockInput[];
  }): TemplateUseCaseResult => {
    const id = makeTemplateId(deps.ids.next());
    if (!id.ok) return err(id.error);

    const created = createTemplate({
      id: id.value,
      name: input.name,
      description: input.description,
      icon: input.icon,
      color: input.color,
      blocks: withIds(input.blocks, deps.ids),
      occurredAt: deps.clock.now().toISOString(),
    });
    if (!created.ok) return err(created.error);

    await deps.templates.save(created.value);
    deps.logger.info('bison.template.created', {
      templateId: created.value.id,
    });
    return ok(toTemplateDto(created.value));
  };

export const makeUpdateTemplate =
  (deps: TemplateUseCaseDeps) =>
  async (input: {
    readonly id: string;
    readonly changes: TemplateChanges;
  }): TemplateUseCaseResult => {
    const id = makeTemplateId(input.id);
    if (!id.ok) return err(id.error);

    const existing = await deps.templates.findById(id.value);
    if (!existing) {
      return err(templateNotFound(`No template with id ${input.id}.`));
    }

    const updated = updateTemplate(
      existing,
      input.changes,
      deps.clock.now().toISOString(),
    );
    if (!updated.ok) return err(updated.error);

    await deps.templates.save(updated.value);
    deps.logger.info('bison.template.updated', { templateId: id.value });
    return ok(toTemplateDto(updated.value));
  };

export const makeListTemplates =
  (deps: TemplateUseCaseDeps) =>
  async (): Promise<ReadonlyArray<TemplateDto>> => {
    const templates = await deps.templates.list();
    return templates.map(toTemplateDto);
  };

export const makeGetTemplate =
  (deps: TemplateUseCaseDeps) =>
  async (input: { readonly id: string }): TemplateUseCaseResult => {
    const id = makeTemplateId(input.id);
    if (!id.ok) return err(id.error);
    const template = await deps.templates.findById(id.value);
    if (!template) {
      return err(templateNotFound(`No template with id ${input.id}.`));
    }
    return ok(toTemplateDto(template));
  };

export type TemplateUseCases = {
  readonly create: ReturnType<typeof makeCreateTemplate>;
  readonly update: ReturnType<typeof makeUpdateTemplate>;
  readonly list: ReturnType<typeof makeListTemplates>;
  readonly get: ReturnType<typeof makeGetTemplate>;
};

export const makeTemplateUseCases = (
  deps: TemplateUseCaseDeps,
): TemplateUseCases => ({
  create: makeCreateTemplate(deps),
  update: makeUpdateTemplate(deps),
  list: makeListTemplates(deps),
  get: makeGetTemplate(deps),
});
