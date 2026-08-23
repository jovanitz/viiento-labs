import type { AccessClientUseCases, DocumentRenderer } from '@acme/application';
import type { BisonClientFlowDeps } from '@acme/bison-application';
import { createUseCasesSeam } from '@acme/ui';

/**
 * The bison CLIENT app's DI bundle (ADR-0019) — separate from the
 * dashboard's `BisonUseCases` on purpose: the two apps wire different
 * worlds. Both fields are REQUIRED: the composition root either builds the
 * app (gateway + identity) or it does not.
 */
export type BisonClientAppUseCases = BisonClientFlowDeps & {
  /** Sign-in/out + the session gate's access snapshot. */
  readonly access: AccessClientUseCases;
  /** Documents leave the business as PDF bytes (ADR-0020 §8). */
  readonly documents: {
    readonly renderer: DocumentRenderer;
  };
};

export const {
  UseCasesProvider: ClientUseCasesProvider,
  useUseCases: useClientUseCases,
} = createUseCasesSeam<BisonClientAppUseCases>();
