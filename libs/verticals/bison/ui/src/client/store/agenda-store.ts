import { createStore } from 'zustand/vanilla';
import type {
  AgendaDayVM,
  BisonClientFlowDeps,
  CalendarBlockDto,
  ClientRowVM,
} from '@acme/bison-application';
import {
  addCalendarBlock,
  bookAppointment,
  cancelAppointment,
  createClient,
  loadAgendaDay,
  loadCalendarBlocks,
  loadClients,
  removeCalendarBlock,
  rescheduleAppointment,
} from '@acme/bison-application';

/**
 * The thin, reactive store for the Schedule (grid) section. Delegates to
 * the headless agenda controllers; the roster rides along for the
 * New-appointment combobox. Booking resolves the typed client name against
 * the roster and creates the client first when it's new — ONE creation
 * point, so the combobox's inline "Create" never double-creates.
 */
type MoveChange = {
  readonly id: string;
  readonly startMin: number;
  readonly durationMinutes: number;
};

export type AgendaStoreState = {
  readonly day: AgendaDayVM | null;
  readonly clients: ReadonlyArray<ClientRowVM> | null;
  readonly blocks: ReadonlyArray<CalendarBlockDto>;
  readonly loading: boolean;
  readonly error: string | null;
  readonly load: (date: string) => Promise<void>;
  readonly book: (input: {
    readonly clientName: string;
    readonly service: string;
    readonly staffName: string;
    readonly startMin: number;
    readonly durationMinutes: number;
  }) => Promise<boolean>;
  readonly cancel: (id: string) => Promise<boolean>;
  readonly applyMoves: (changes: readonly MoveChange[]) => Promise<number>;
  readonly addBlock: (
    input: Parameters<typeof addCalendarBlock>[1],
  ) => Promise<boolean>;
  readonly removeBlock: (id: string) => Promise<boolean>;
};

export type AgendaStore = ReturnType<typeof createAgendaStore>;

/** Local calendar date (never toISOString — TZ must not shear the day). */
export const localDate = (at: Date): string =>
  `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(
    at.getDate(),
  ).padStart(2, '0')}`;

type Set = (partial: Partial<AgendaStoreState>) => void;
type Get = () => AgendaStoreState;

const reloadDay = async (
  deps: BisonClientFlowDeps,
  set: Set,
  get: Get,
  date: string,
): Promise<void> => {
  const [day, roster, blocks] = await Promise.all([
    loadAgendaDay(deps, { date, today: localDate(new Date()) }),
    loadClients(deps),
    loadCalendarBlocks(deps),
  ]);
  set(
    day.ok
      ? {
          loading: false,
          error: null,
          day: day.value,
          clients: roster.ok ? roster.value.clients : (get().clients ?? []),
          blocks: blocks.ok ? blocks.value : get().blocks,
        }
      : { loading: false, error: day.error.message },
  );
};

const clientIdByName = async (
  deps: BisonClientFlowDeps,
  get: Get,
  name: string,
): Promise<string | null> => {
  const existing = get().clients?.find((c) => c.name === name);
  if (existing) return existing.id;
  const created = await createClient(deps, { name });
  return created.ok ? created.value.id : null;
};

const bookOn = async (
  deps: BisonClientFlowDeps,
  set: Set,
  get: Get,
  input: Parameters<AgendaStoreState['book']>[0],
): Promise<boolean> => {
  const date = get().day?.date;
  if (!date) return false;
  const clientId = await clientIdByName(deps, get, input.clientName);
  if (!clientId) {
    set({ error: `Couldn't create ${input.clientName}.` });
    return false;
  }
  const booked = await bookAppointment(deps, {
    clientId,
    service: input.service,
    staffName: input.staffName,
    date,
    startMin: input.startMin,
    durationMinutes: input.durationMinutes,
  });
  if (!booked.ok) {
    set({ error: booked.error.message });
    return false;
  }
  await reloadDay(deps, set, get, date);
  return true;
};

const applyMovesOn = async (
  deps: BisonClientFlowDeps,
  set: Set,
  get: Get,
  changes: readonly MoveChange[],
): Promise<number> => {
  const date = get().day?.date;
  if (!date) return 0;
  let applied = 0;
  for (const change of changes) {
    const result = await rescheduleAppointment(deps, {
      id: change.id,
      move: {
        startMin: change.startMin,
        durationMinutes: change.durationMinutes,
      },
    });
    if (result.ok) applied += 1;
    else set({ error: result.error.message });
  }
  await reloadDay(deps, set, get, date);
  return applied;
};

export const createAgendaStore = (deps: BisonClientFlowDeps) =>
  createStore<AgendaStoreState>((set, get) => ({
    day: null,
    clients: null,
    blocks: [],
    loading: false,
    error: null,

    addBlock: async (input) => {
      const result = await addCalendarBlock(deps, input);
      if (!result.ok) {
        set({ error: result.error.message });
        return false;
      }
      set({ blocks: [...get().blocks, result.value] });
      return true;
    },
    removeBlock: async (id) => {
      const result = await removeCalendarBlock(deps, { id });
      if (!result.ok) {
        set({ error: result.error.message });
        return false;
      }
      set({ blocks: get().blocks.filter((block) => block.id !== id) });
      return true;
    },

    load: async (date) => {
      set({ loading: true });
      await reloadDay(deps, set, get, date);
    },
    book: (input) => bookOn(deps, set, get, input),
    cancel: async (id) => {
      const date = get().day?.date;
      if (!date) return false;
      const result = await cancelAppointment(deps, { id });
      if (!result.ok) {
        set({ error: result.error.message });
        return false;
      }
      await reloadDay(deps, set, get, date);
      return true;
    },
    applyMoves: (changes) => applyMovesOn(deps, set, get, changes),
  }));
