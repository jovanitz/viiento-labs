import { useEffect, useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { useClientUseCases } from '../di';
import { createAgendaStore, type AgendaStore } from './agenda-store';
import { createClientGateStore, type ClientGateStore } from './gate-store';
import { createFormatsStore, type FormatsStore } from './formats-store';
import { createIdentityStore, type IdentityStore } from './identity-store';
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

export const useIdentityStore = (): IdentityStore => {
  const { gateway } = useClientUseCases();
  return useMemo(() => createIdentityStore({ gateway }), [gateway]);
};

export const useClientGateStore = (): ClientGateStore => {
  const { access } = useClientUseCases();
  return useMemo(() => createClientGateStore({ access }), [access]);
};

/** The signed-in owner's display name — what individual-mode records
 *  (booking staffName) and the account switcher show. Undefined while the
 *  session loads or in DI-less stories. */
export const useSessionOwnerName = (): string | undefined => {
  const { access } = useClientUseCases();
  const [name, setName] = useState<string | undefined>();
  useEffect(() => {
    let active = true;
    void access.getSession().then((session) => {
      if (!active || !session.ok) return;
      const { displayName, email } = session.value.user;
      setName(displayName ?? email ?? undefined);
    });
    return () => {
      active = false;
    };
  }, [access]);
  return name;
};

/** Re-export zustand's selector hook so components import it from one place. */
export { useStore };
