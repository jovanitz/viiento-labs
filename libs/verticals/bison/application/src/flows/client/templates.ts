import { type Result, err, ok } from '@acme/shared';
import type {
  TemplateBlock,
  TemplateColor,
  TemplateIcon,
} from '@acme/bison-domain';
import type { TemplateDto } from '../../templates/dto';
import type {
  BisonClientGateway,
  BisonGatewayError,
} from '../../client/gateway';
import type { BisonClientFlowDeps } from './clients';

/**
 * The Templates controller: headless orchestration for the template
 * library section. `saveTemplate` owns the create-vs-update decision (the
 * Builder hands over a whole template either way), so neither the UI store
 * nor a conversational caller ever reimplements it.
 */
export type TemplatesVM = {
  readonly templates: ReadonlyArray<TemplateDto>;
  readonly empty: boolean;
};

/** Query: the library, defaults first then customs by name (server order). */
export const loadTemplates = async (
  deps: BisonClientFlowDeps,
): Promise<Result<TemplatesVM, BisonGatewayError>> => {
  const listed = await deps.gateway.templates.list();
  if (!listed.ok) return err(listed.error);
  return ok({ templates: listed.value, empty: listed.value.length === 0 });
};

export type SaveTemplateInput = {
  /** Set when the Builder was editing an EXISTING backend template; a new
   *  one arrives without it (the Builder's local id is never persisted —
   *  the backend assigns identity). Block ids ARE kept: entries reference
   *  them. */
  readonly existingId?: string | undefined;
  readonly name: string;
  readonly description: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  readonly blocks: ReadonlyArray<TemplateBlock>;
};

/** Command: persist what the Builder produced — update when it edited an
 *  existing template, create otherwise. */
export const saveTemplate = (
  deps: { readonly gateway: BisonClientGateway },
  input: SaveTemplateInput,
): Promise<Result<TemplateDto, BisonGatewayError>> => {
  const { existingId, ...template } = input;
  return existingId
    ? deps.gateway.templates.update({ id: existingId, changes: template })
    : deps.gateway.templates.create(template);
};
