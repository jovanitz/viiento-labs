import { createContext, useContext, type ReactNode } from 'react';

/**
 * The UI's dependency-injection seam — the MECHANISM, and nothing else.
 *
 * The UI layer is forbidden (by the Nx boundary rules) from importing
 * infrastructure or platform. Instead it declares *what* it needs — a bundle of
 * use cases — and reads them from React context. Each app's composition root
 * builds the real (or mock) use cases and provides them here, so the very same
 * screen renders against live adapters in an app and against fakes in tests,
 * with no code change.
 *
 * This factory is generic on purpose ([ADR-0019](../../../../docs/adr/0019-vertical-tag-axis.md)).
 * It used to export one concrete `AppUseCases` type listing every feature of
 * every app, which made shared code name one vertical's use cases — and forced
 * every field to be optional, since no single app wired them all. Two costs
 * followed: an app had to stub bundles it never rendered just to satisfy the
 * contract, and screens defended against `undefined` on bundles their own app
 * always wires.
 *
 * Now each vertical calls this once and declares its OWN bundle, with required
 * fields. Core learns nothing about anyone's features, and a vertical's screens
 * get a bundle that cannot be half-wired.
 *
 * ```ts
 * export const { UseCasesProvider, useUseCases } =
 *   createUseCasesSeam<BisonUseCases>();
 * ```
 */
export const createUseCasesSeam = <T,>() => {
  const Context = createContext<T | null>(null);

  const UseCasesProvider = ({
    useCases,
    children,
  }: {
    useCases: T;
    children: ReactNode;
  }) => <Context.Provider value={useCases}>{children}</Context.Provider>;

  /**
   * Throws rather than returning a Result: a missing provider is a wiring
   * mistake in the composition root, not an expected runtime failure.
   */
  const useUseCases = (): T => {
    const ctx = useContext(Context);
    if (!ctx) {
      throw new Error(
        'useUseCases must be used within a <UseCasesProvider>. Wire it in your composition root.',
      );
    }
    return ctx;
  };

  return { UseCasesProvider, useUseCases };
};
