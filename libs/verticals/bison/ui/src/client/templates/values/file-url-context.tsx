import { createContext, useContext, type ReactNode } from 'react';

/**
 * Seam for resolving a stored file's `storagePath` to a short-lived signed
 * URL. The WIRED detail provides a gateway-backed resolver; the bare
 * prototype and stories render without one, so stored refs simply show as
 * name-only chips (their bytes aren't on board). A context — not a prop —
 * because the display sits deep inside frozen views.
 */
export type FileUrlResolver = (storagePath: string) => Promise<string | null>;

const FileUrlContext = createContext<FileUrlResolver | null>(null);

export const FileUrlResolverProvider = ({
  resolver,
  children,
}: {
  readonly resolver: FileUrlResolver;
  readonly children: ReactNode;
}) => (
  <FileUrlContext.Provider value={resolver}>{children}</FileUrlContext.Provider>
);

export const useFileUrlResolver = (): FileUrlResolver | null =>
  useContext(FileUrlContext);
