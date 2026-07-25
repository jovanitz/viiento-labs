import { createStore } from 'zustand/vanilla';
import {
  type AccessClientUseCases,
  type AuditGateway,
  loadAuditTrail,
} from '@acme/application';
import type { AuditVM } from '../../audit/audit.types';
import { toAuditRow } from './audit-vm';

/**
 * Reactive store for the audit trail (ADR-0010, gated on `audit.read`). `load`
 * runs the headless `loadAuditTrail` flow: without the capability it returns
 * hidden → the view shows a "not available" state, never a misleading empty
 * one. Rows arrive already enriched server-side; the mapper only reshapes them.
 */
const LOADING: AuditVM = { entries: [], loading: true };

export type AuditStoreDeps = {
  readonly access: AccessClientUseCases;
  readonly audit: AuditGateway;
};

export type AuditStoreState = {
  readonly vm: AuditVM;
  readonly load: () => Promise<void>;
};

export const createAuditStore = (deps: AuditStoreDeps) =>
  createStore<AuditStoreState>((set) => ({
    vm: LOADING,
    load: async () => {
      set({ vm: LOADING });
      const r = await loadAuditTrail({
        access: deps.access,
        audit: deps.audit,
      });
      if (!r.ok) {
        set({ vm: { entries: [], error: r.error.message } });
        return;
      }
      set({
        vm: r.value.hidden
          ? { entries: [], hidden: true }
          : { entries: r.value.entries.map(toAuditRow) },
      });
    },
  }));

export type AuditStore = ReturnType<typeof createAuditStore>;
