import { useEffect } from 'react';
import { useAuditStore, useStore } from '../store/hooks';
import type { AuditStore } from '../store/audit/audit-store';
import { AuditView } from './audit.view';
import type { AuditRow } from './audit.types';

/**
 * The DI-bound Audit container (ADR-0010, ADR-0017 giro-owned). Reads the
 * enriched audit ViewModel from the store and renders the pure `AuditView`.
 * No orchestration here; the `audit.read` gate is enforced server-side (the
 * flow returns hidden → the view shows a "not available" state). `onOpenTarget`
 * is a placeholder until cross-section navigation from the trail is wired.
 */
const AuditBound = ({
  store,
  onOpenTarget,
}: {
  readonly store: AuditStore;
  readonly onOpenTarget?: ((row: AuditRow) => void) | undefined;
}) => {
  const vm = useStore(store, (state) => state.vm);
  useEffect(() => {
    void store.getState().load();
  }, [store]);
  return <AuditView vm={vm} onOpenTarget={onOpenTarget} />;
};

export const AuditSection = ({
  onOpenTarget,
}: {
  readonly onOpenTarget?: ((row: AuditRow) => void) | undefined;
}) => {
  const store = useAuditStore();
  if (!store) return null;
  return <AuditBound store={store} onOpenTarget={onOpenTarget} />;
};
