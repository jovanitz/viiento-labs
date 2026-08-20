import { createConsoleLogger, type Logger } from '@acme/shared';
import { makeAccessClientUseCases } from '@acme/application';
import type { AuthProvider } from '@acme/application';
import type { BisonClientAppUseCases } from '@acme/bison-ui';
import { createRpcBisonGateway } from '@acme/bison-infrastructure';
import {
  createFakeAuthProvider,
  createHttpApiClient,
  createRpcAccessGateway,
  createSupabaseAuthProvider,
} from '@acme/infrastructure';
import { createBrowserPlatform, type Platform } from '@acme/platform';

/**
 * The bison CLIENT app's composition root (ADR-0017/0019) — the
 * business-facing individual-account app, isolated from the dashboard's:
 * its own adapters, shell and routing. Identity (Supabase or the local dev
 * seam), an API transport, the access bundle behind the session gate, and
 * the `bison.*` gateway over the same transport.
 */
export type BisonClientConfig = {
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
   * LOCAL-ONLY: with `devAuth`, start signed OUT so the real login screen
   * shows and any sign-in click drops into the seeded world (to demo the
   * flow). Default false = auto-authenticated. Never set in prod.
   */
  devStartSignedOut?: boolean;
};

export type BisonClientRuntime = {
  readonly useCases: BisonClientAppUseCases;
  readonly platform: Platform;
  readonly logger: Logger;
};

/** The dev fake provider, optionally starting at the login screen (demo
 *  mode) with the sign-in flag persisted so a refresh keeps you in. */
const buildDevAuth = (
  config: BisonClientConfig,
  platform: Platform,
): AuthProvider => {
  if (!config.devStartSignedOut)
    return createFakeAuthProvider({ accessToken: config.devSession });
  return createFakeAuthProvider(
    { accessToken: config.devSession },
    {
      startSignedOut: true,
      storage: {
        get: () => platform.secureStorage.get('bison-client-dev-auth'),
        set: (v) =>
          v
            ? platform.secureStorage.set('bison-client-dev-auth', v)
            : platform.secureStorage.remove('bison-client-dev-auth'),
      },
    },
  );
};

/** Identity behind the port: the dev seam locally, Supabase everywhere else. */
const buildAuth = (
  config: BisonClientConfig,
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

export const createBisonClientRuntime = (
  config: BisonClientConfig,
): BisonClientRuntime => {
  const logger = createConsoleLogger({ app: 'bison-client' });
  const platform = createBrowserPlatform(
    import.meta.env['VITE_APP_VERSION'] ?? '0.0.0',
  );

  const auth = buildAuth(config, platform);
  const api = createHttpApiClient({ baseUrl: config.apiBaseUrl, auth });

  return {
    useCases: {
      gateway: createRpcBisonGateway({ api }),
      access: makeAccessClientUseCases({
        auth,
        gateway: createRpcAccessGateway({ api }),
      }),
    },
    platform,
    logger,
  };
};
