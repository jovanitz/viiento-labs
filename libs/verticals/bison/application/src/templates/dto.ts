import type {
  Template,
  TemplateBlock,
  TemplateColor,
  TemplateIcon,
  TemplateKind,
} from '@acme/bison-domain';

/** The template as the UI (and the RPC edge) sees it — brands erased. */
export type TemplateDto = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  readonly kind: TemplateKind;
  readonly blocks: readonly TemplateBlock[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export const toTemplateDto = (template: Template): TemplateDto => ({
  id: template.id,
  name: template.name,
  description: template.description,
  icon: template.icon,
  color: template.color,
  kind: template.kind,
  blocks: template.blocks,
  createdAt: template.createdAt,
  updatedAt: template.updatedAt,
});
