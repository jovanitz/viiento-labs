import type { Template, TemplateId } from '@acme/bison-domain';

/**
 * Repository port for the account's template library. Deals only in domain
 * entities — the adapter (in-memory today, Postgres/Supabase next) owns rows
 * and JSON columns. `list` returns defaults and customs alike, in the order
 * the gallery shows them (defaults first, then customs by name).
 */
export type TemplateRepository = {
  readonly findById: (id: TemplateId) => Promise<Template | null>;
  readonly list: () => Promise<ReadonlyArray<Template>>;
  readonly save: (template: Template) => Promise<void>;
};
