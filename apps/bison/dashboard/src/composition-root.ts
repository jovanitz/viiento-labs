import {
  createConsoleLogger,
  type Logger,
} from '@acme/shared';
import {
  makeAccessClientUseCases,
  makeBlockUseCases,
  makeDirectoryUseCases,
  makeInvitationsUseCases,
  makeMembersUseCases,
  type AuthProvider,
} from '@acme/application';
import {
  createFakeAuthProvider,
  createHttpApiClient,
  createRpcAccessGateway,
  createRpcAccountAdminGateway,
  createRpcBillingGateway,
  createRpcOrgDetailGateway,
  createRpcAuditGateway,
  createRpcSessionsGateway,
  createRpcSettingsGateway,
  createRpcActivationGateway,
  createRpcBlockGateway,
  createRpcCoverageGateway,
  createRpcDirectoryGateway,
  createRpcInvitationsGateway,
  createRpcMembersGateway,
  createRpcRolesGateway,
  createSupabaseAuthProvider,
} from '@acme/infrastructure';
import { createBrowserPlatform, type Platform } from '@acme/platform';
import type { BisonUseCases } from '@acme/bison-ui';

/**
 * The BISON vertical's composition root (ADR-0017, ADR-0019) — isolated from
 * every other vertical: its own adapters, shell and routing, never referencing
 * `apps/lab/dashboard`. Online-only and staff-facing: identity (Supabase or the
 * local dev seam), an API transport, and the access + directory + billing
 * coverage gateways over it. It builds `BisonUseCases`, whose fields are all
 * required — so there is nothing to stub and nothing downstream to guard.
 *
 * NOTE: this reuses the existing giro's API + Supabase locally. Physical
 * isolation of the API/DB per ADR-0017 is a deliberate follow-up.
 */
export type BisonManagerConfig = {
  apiBaseUrl: string;
  supabaseUrl: string;
  /** Public (anon/publishable) key — not a secret; the API enforces access. */
  supabaseAnonKey: string;
  /**
   * LOCAL-ONLY escape hatch: when true, identity is a static dev session
   * (`Bearer <devSession>`) instead of Supabase, so the app runs against the
   * API's dev-stub seeded world with NO interactive login. Never set in prod.
   */
  devAuth: boolean;
  devSession: string;
  /**
   * LOCAL-ONLY: with `devAuth`, start signed OUT so the real login screen shows
   * and any sign-in click drops into the seeded world (to demo the login flow).
   * Default false = auto-authenticated (skip the login). Never set in prod.
   */
  devStartSignedOut?: boolean;
};

export type BisonManagerRuntime = {
  readonly useCases: BisonUseCases;
  readonly platform: Platform;
  readonly logger: Logger;
};

/** The dev fake provider, optionally starting at the login screen (demo mode)
 *  with the sign-in flag persisted so a refresh keeps you in. */
const buildDevAuth = (
  config: BisonManagerConfig,
  platform: Platform,
): AuthProvider => {
  if (!config.devStartSignedOut)
    return createFakeAuthProvider({ accessToken: config.devSession });
  return createFakeAuthProvider(
    { accessToken: config.devSession },
    {
      startSignedOut: true,
      storage: {
        get: () => platform.secureStorage.get('mm-dev-auth'),
        set: (v) =>
          v
            ? platform.secureStorage.set('mm-dev-auth', v)
            : platform.secureStorage.remove('mm-dev-auth'),
      },
    },
  );
};

/** Identity behind the port: the dev seam locally, Supabase everywhere else. */
const buildAuth = (
  config: BisonManagerConfig,
  platform: Platform,
): AuthProvider =>
  config.devAuth
    ? buildDevAuth(config, platform)
    : createSupabaseAuthProvider({
        supabaseUrl: config.supabaseUrl,
        anonKey: config.supabaseAnonKey,
        storage: {
          get: () => platform.secureStorage.get('session'),
          set: (v) =>
            v
              ? platform.secureStorage.set('session', v)
              : platform.secureStorage.remove('session'),
        },
      });

export const createBisonManagerRuntime = (
  config: BisonManagerConfig,
): BisonManagerRuntime => {
  const logger = createConsoleLogger({ app: 'bison-manager' });
  const platform = createBrowserPlatform(
    import.meta.env['VITE_APP_VERSION'] ?? '0.0.0',
  );

  const auth = buildAuth(config, platform);
  const api = createHttpApiClient({ baseUrl: config.apiBaseUrl, auth });

  const access = makeAccessClientUseCases({
    auth,
    gateway: createRpcAccessGateway({ api }),
  });
  const directory = makeDirectoryUseCases({
    gateway: createRpcDirectoryGateway({ api }),
  });
  // Derived billing coverage (ADR-0018) for the Directory's Organizations rows.
  const coverage = createRpcCoverageGateway({ api });
  const invitations = makeInvitationsUseCases({
    invitations: createRpcInvitationsGateway({ api }),
    activation: createRpcActivationGateway({ baseUrl: config.apiBaseUrl }),
  });
  const members = makeMembersUseCases({
    gateway: createRpcMembersGateway({ api }),
  });
  const block = makeBlockUseCases({ gateway: createRpcBlockGateway({ api }) });
  const roles = createRpcRolesGateway({ api });
  const accounts = createRpcAccountAdminGateway({ api });
  // The org drill-down (ADR-0018): summary + roster read, and the billing
  // surface (summary + coverage + ledger + levers + void/refund corrections).
  const orgDetail = createRpcOrgDetailGateway({ api });
  const billing = createRpcBillingGateway({ api });
  const audit = createRpcAuditGateway({ api });
  const sessions = createRpcSessionsGateway({ api });
  const settings = createRpcSettingsGateway({ api });

  return {
    useCases: {
      access,
      directory,
      coverage,
      invitations,
      members,
      block,
      roles,
      accounts,
      orgDetail,
      billing,
      audit,
      sessions,
      settings,
    },
    platform,
    logger,
  };
};
