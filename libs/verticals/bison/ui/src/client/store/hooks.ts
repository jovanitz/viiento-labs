import { useMemo } from 'react';
import { useStore } from 'zustand';
import { useClientUseCases } from '../di';
import { createAgendaStore, type AgendaStore } from './agenda-store';
import { createClientGateStore, type ClientGateStore } from './gate-store';
import { createFormatsStore, type FormatsStore } from './formats-store';
import { createClientsStore, type ClientsStore } from './clients-store';
import { createTemplatesStore, type TemplatesStore } from './templates-store';

/**
 * React bindings for the client app: build the per-feature store from the
 * DI bundle (memoized on the stable gateway identity, so the store is
 * created once) and subscribe with a selector. The store delegates to the
 * headless controllers — these hooks are the ONLY place the UI ties React
 * to them.
 */
export const useClientsStore = (): ClientsStore => {
  const { gateway } = useClientUseCases();
  return useMemo(() => createClientsStore({ gateway }), [gateway]);
};

export const useTemplatesStore = (): TemplatesStore => {
  const { gateway } = useClientUseCases();
  return useMemo(() => createTemplatesStore({ gateway }), [gateway]);
};

export const useAgendaStore = (): AgendaStore => {
  const { gateway } = useClientUseCases();
  return useMemo(() => createAgendaStore({ gateway }), [gateway]);
};

export const useFormatsStore = (): FormatsStore => {
  const { gateway } = useClientUseCases();
  return useMemo(() => createFormatsStore({ gateway }), [gateway]);
};

export const useClientGateStore = (): ClientGateStore => {
  const { access } = useClientUseCases();
  return useMemo(() => createClientGateStore({ access }), [access]);
};

/** Re-export zustand's selector hook so components import it from one place. */
export { useStore };
