import type { ApiProcedure } from '../../rpc/procedure';
import { createBisonAgendaProcedures } from './surfaces/agenda-procedures';
import { createBisonClientProcedures } from './surfaces/clients-procedures';
import { createBisonDocumentProcedures } from './surfaces/documents-procedures';
import { createBisonFileProcedures } from './surfaces/files-procedures';
import { createBisonIssuanceProcedures } from './surfaces/issuance-procedures';
import { createBisonTemplateProcedures } from './surfaces/templates-procedures';
import { createBisonTimelineProcedures } from './surfaces/timeline-procedures';
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
  ...createBisonIssuanceProcedures(deps),
];
