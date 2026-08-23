import { createConsoleLogger, type Logger } from '@acme/shared';
import { makeAccessClientUseCases } from '@acme/application';
import type { AuthProvider } from '@acme/application';
import type { BisonClientAppUseCases } from '@acme/bison-ui';
import {
  createRpcBisonGateway,
  withOfflineCache,
} from '@acme/bison-infrastructure';
import {
  createDexieKvCache,
  createFakeAuthProvider,
  createHttpApiClient,
  createPdfDocumentRenderer,
  createRpcAccessGateway,
  createSupabaseAuthProvider,
  withOfflineAccessCache,
} from '@acme/infrastructure';
import type { FontFaceBytes } from '@acme/infrastructure';
import type { FamilyKey } from '@acme/application';
import interRegular from './assets/fonts/Inter-Regular.otf?url';
import interSemiBold from './assets/fonts/Inter-SemiBold.otf?url';
import interBold from './assets/fonts/Inter-Bold.otf?url';
import serifRegular from './assets/fonts/SourceSerif4-Regular.otf?url';
import serifSemiBold from './assets/fonts/SourceSerif4-Semibold.otf?url';
import serifBold from './assets/fonts/SourceSerif4-Bold.otf?url';
import slabRegular from './assets/fonts/RobotoSlab-Regular.ttf?url';
import slabSemiBold from './assets/fonts/RobotoSlab-SemiBold.ttf?url';
import slabBold from './assets/fonts/RobotoSlab-Bold.ttf?url';
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

const FONT_URLS: Record<FamilyKey, Record<keyof FontFaceBytes, string>> = {
  sans: { regular: interRegular, semibold: interSemiBold, bold: interBold },
  serif: { regular: serifRegular, semibold: serifSemiBold, bold: serifBold },
  slab: { regular: slabRegular, semibold: slabSemiBold, bold: slabBold },
};

/** The shipped document fonts, fetched on the first issue. A failed fetch
 *  drops that family to the PDF standard fonts — degraded look, never a
 *  blocked issuance (the adapter's contract). */
const loadDocumentFonts = async (): Promise<
  Partial<Record<FamilyKey, FontFaceBytes>>
> => {
  const fetchBytes = async (url: string): Promise<Uint8Array> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Font fetch failed: ${url}`);
    return new Uint8Array(await response.arrayBuffer());
  };
  const entries = await Promise.all(
    (Object.entries(FONT_URLS) as ReadonlyArray<
      [FamilyKey, Record<keyof FontFaceBytes, string>]
    >).map(async ([family, urls]) => {
      try {
        const [regular, semibold, bold] = await Promise.all([
          fetchBytes(urls.regular),
          fetchBytes(urls.semibold),
          fetchBytes(urls.bold),
        ]);
        return [[family, { regular, semibold, bold }]] as const;
      } catch {
        return [] as const;
      }
    }),
  );
  return Object.fromEntries(entries.flat());
};

export const createBisonClientRuntime = (
  config: BisonClientConfig,
): BisonClientRuntime => {
  const logger = createConsoleLogger({ app: 'bison-client' });
  const platform = createBrowserPlatform(
    import.meta.env['VITE_APP_VERSION'] ?? '0.0.0',
  );

  const auth = buildAuth(config, platform);
  const api = createHttpApiClient({ baseUrl: config.apiBaseUrl, auth });
  const cache = createDexieKvCache('bison-client-cache');

  return {
    useCases: {
      // Offline read fallback (ADR-0007, first half): reads mirror into
      // IndexedDB and the last known copy answers when the network fails.
      gateway: withOfflineCache(createRpcBisonGateway({ api }), cache),
      access: makeAccessClientUseCases({
        auth,
        gateway: withOfflineAccessCache(createRpcAccessGateway({ api }), cache),
      }),
      documents: {
        renderer: createPdfDocumentRenderer({ loadFonts: loadDocumentFonts }),
      },
    },
    platform,
    logger,
  };
};
