import type { ApiProcedure } from '../../rpc/procedure';
import { createBisonAgendaProcedures } from './agenda-procedures';
import { createBisonClientProcedures } from './clients-procedures';
import { createBisonDocumentProcedures } from './documents-procedures';
import { createBisonFileProcedures } from './files-procedures';
import { createBisonTemplateProcedures } from './templates-procedures';
import { createBisonTimelineProcedures } from './timeline-procedures';
import type { BisonProcedureDeps } from './context';

export type { BisonProcedureDeps } from './context';

/**
 * The bison CLIENT app's surface: templates (dynamic forms), the client
 * roster, the timeline, and captured files. Everything is scoped to the
 * actor's account per request (`forAccount`) — tenancy is the authorization
 * model of the individual-account app.
 */
export const createBisonProcedures = (
  deps: BisonProcedureDeps,
): ReadonlyArray<ApiProcedure> => [
  ...createBisonTemplateProcedures(deps),
  ...createBisonClientProcedures(deps),
  ...createBisonTimelineProcedures(deps),
  ...createBisonFileProcedures(deps),
  ...createBisonAgendaProcedures(deps),
  ...createBisonDocumentProcedures(deps),
];
