import { Suspense, lazy, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom';
import { installDebugBridge } from '@acme/ui';
import { ClientUseCasesProvider, RequireClientSession } from '@acme/bison-ui';
import type { BisonClientRuntime } from './composition-root';
import {
  AgendaRoute,
  ClientsRoute,
  SettingsRoute,
  TemplatesRoute,
} from './routes/sections';

/**
 * The bison-client shell: providers + REAL section routing. Every main
 * section is a URL (deep links, back button and cross-section jumps work);
 * the chrome lives in the layout route. The shell is code-split so the
 * initial bundle stays thin.
 */
const ShellRoute = lazy(() => import('./routes/shell-route'));

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<p>Loading…</p>}>
        <ShellRoute />
      </Suspense>
    ),
    children: [
      { index: true, element: <Navigate to="/agenda" replace /> },
      { path: 'agenda', element: <AgendaRoute /> },
      { path: 'clients', element: <ClientsRoute /> },
      { path: 'clients/:clientId', element: <ClientsRoute /> },
      { path: 'templates', element: <TemplatesRoute /> },
      { path: 'settings', element: <SettingsRoute /> },
      { path: '*', element: <Navigate to="/agenda" replace /> },
    ],
  },
]);

export const App = ({ runtime }: { runtime: BisonClientRuntime }) => {
  const [queryClient] = useState(() => new QueryClient());

  // DEV-only runtime introspection bridge (window.__app__) — tree-shaken in
  // prod. Exposes the bison.* gateway so the RPC surface is pokeable from
  // the console.
  useEffect(() => {
    if (import.meta.env.DEV) {
      installDebugBridge({ queryClient, useCases: runtime.useCases.gateway });
    }
  }, [queryClient, runtime]);

  return (
    <QueryClientProvider client={queryClient}>
      <ClientUseCasesProvider useCases={runtime.useCases}>
        <RequireClientSession>
          <RouterProvider router={router} />
        </RequireClientSession>
      </ClientUseCasesProvider>
    </QueryClientProvider>
  );
};
