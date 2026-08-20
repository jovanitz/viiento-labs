import { useEffect, useMemo, useState } from 'react';
import { toast } from '@acme/ui';
import { localDate } from '../../store/agenda-store';
import { useAgendaStore, useStore } from '../../store/hooks';
import { ScheduleView } from '../schedule.view';
import type { ClientRow } from '../../clients/clients.types';
import {
  applyVia,
  blockVia,
  bookVia,
  cancelVia,
  optimisticRow,
  removeBlockVia,
  toClientRows,
} from './schedule.container.actions';
import { toScheduleVM, toUiBlocks } from './schedule.container.vm';

/**
 * The DI-bound Schedule (grid) section. Day data and EVERY mutation —
 * booking, cancel, Reorder's Apply, blocked time — go through the store →
 * agenda flows → `bison.*` gateway; `ScheduleView` and the whole grid stay
 * untouched. Only the buffer knob remains session-local (Settings later);
 * cross-navigation to a client's record arrives with section routing.
 */
export const ScheduleContainer = ({
  onOpenClient,
}: {
  /** From an appointment straight to that client's record (the app wires
   *  it to `/clients/:id`). Absent — stories — the jump degrades to a
   *  toast. */
  readonly onOpenClient?: ((clientId: string) => void) | undefined;
} = {}) => {
  const store = useAgendaStore();
  const day = useStore(store, (s) => s.day);
  const clients = useStore(store, (s) => s.clients);
  const loading = useStore(store, (s) => s.loading);
  const error = useStore(store, (s) => s.error);
  const blocks = useStore(store, (s) => s.blocks);
  const [today] = useState(() => new Date());
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [pending, setPending] = useState<readonly ClientRow[]>([]);

  useEffect(() => {
    void store.getState().load(localDate(new Date()));
  }, [store]);

  const vm = useMemo(
    () =>
      day
        ? toScheduleVM(day, today, {
            blocks: toUiBlocks(blocks),
            bufferMinutes,
            loading,
          })
        : null,
    [day, today, blocks, bufferMinutes, loading],
  );

  if (!vm) {
    return (
      <p className="text-sm text-muted-foreground">
        {error ?? 'Loading the agenda…'}
      </p>
    );
  }

  return (
    <ScheduleView
      vm={vm}
      onSelectDay={(id) => void store.getState().load(id)}
      onCreateAppointment={(appointment) => void bookVia(store, appointment)}
      onCancelAppointment={(id) => void cancelVia(store, id)}
      onOpenClient={(clientName) => {
        const client = (clients ?? []).find((c) => c.name === clientName);
        if (client && onOpenClient) onOpenClient(client.id);
        else if (!client) toast.error(`No client record for ${clientName}`);
        else toast.info('Open the Clients section to see the record.');
      }}
      onBlockTime={(block) => void blockVia(store, block)}
      onRemoveBlock={(id) => void removeBlockVia(store, id)}
      onBufferChange={setBufferMinutes}
      onApply={(changes) => void applyVia(store, changes)}
      onRetry={() =>
        void store
          .getState()
          .load(vm.days.find((d) => d.active)?.id ?? localDate(new Date()))
      }
      clients={toClientRows(clients, pending)}
      onCreateClient={(name) => {
        const row = optimisticRow(name);
        setPending((rows) => [...rows, row]);
        return row;
      }}
    />
  );
};
