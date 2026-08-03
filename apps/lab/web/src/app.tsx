import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { installDebugBridge } from '@acme/ui';
import { AccessLoginScreen, ItemScreen, UseCasesProvider, type LabUseCases } from '@acme/lab-ui';

/**
 * The web app shell: providers + routing. It is deliberately thin — all the
 * interesting wiring happened in the composition root, and all the behaviour
 * lives in the reusable `@acme/ui` feature screens.
 */
const router = createBrowserRouter([
  { path: '/', element: <ItemScreen /> },
  { path: '/login', element: <AccessLoginScreen /> },
]);

export const App = ({ useCases }: { useCases: LabUseCases }) => {
  // One stable client for the app's lifetime.
  const [queryClient] = useState(() => new QueryClient());

  // DEV-only runtime introspection bridge (window.__app__) — tree-shaken in prod.
  useEffect(() => {
    if (import.meta.env.DEV) {
      installDebugBridge({ queryClient, useCases });
    }
  }, [queryClient, useCases]);

  return (
    <QueryClientProvider client={queryClient}>
      <UseCasesProvider useCases={useCases}>
        <RouterProvider router={router} />
      </UseCasesProvider>
    </QueryClientProvider>
  );
};
