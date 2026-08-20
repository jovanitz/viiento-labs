import {
  type Clock,
  type IdGenerator,
  type Logger,
  type Result,
  err,
  ok,
} from '@acme/shared';
import { createCalendarBlock, makeCalendarBlockId } from '@acme/bison-domain';
import type {
  AppointmentDomainError,
  CalendarBlock,
  CalendarBlockDates,
} from '@acme/bison-domain';
import type { CalendarBlockRepository } from './ports';

/** The block as the UI (and the RPC edge) sees it — brands erased. */
export type CalendarBlockDto = {
  readonly id: string;
  readonly label: string;
  readonly allDay: boolean;
  readonly startMin: number;
  readonly endMin: number;
  readonly dates: CalendarBlockDates;
  readonly createdAt: string;
};

const toDto = (block: CalendarBlock): CalendarBlockDto => ({
  id: block.id,
  label: block.label,
  allDay: block.allDay,
  startMin: block.startMin,
  endMin: block.endMin,
  dates: block.dates,
  createdAt: block.createdAt,
});

export type CalendarBlockUseCaseDeps = {
  readonly blocks: CalendarBlockRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly logger: Logger;
};

export const makeAddCalendarBlock =
  (deps: CalendarBlockUseCaseDeps) =>
  async (input: {
    readonly label: string;
    readonly allDay: boolean;
    readonly startMin: number;
    readonly endMin: number;
    readonly dates: CalendarBlockDates;
  }): Promise<Result<CalendarBlockDto, AppointmentDomainError>> => {
    const id = makeCalendarBlockId(deps.ids.next());
    if (!id.ok) return err(id.error);
    const created = createCalendarBlock({
      id: id.value,
      ...input,
      occurredAt: deps.clock.now().toISOString(),
    });
    if (!created.ok) return err(created.error);
    await deps.blocks.save(created.value);
    deps.logger.info('bison.agenda.block-added', { blockId: created.value.id });
    return ok(toDto(created.value));
  };

/** Idempotent — removing an already-gone block is not an error. */
export const makeRemoveCalendarBlock =
  (deps: CalendarBlockUseCaseDeps) =>
  async (input: {
    readonly id: string;
  }): Promise<Result<void, AppointmentDomainError>> => {
    const id = makeCalendarBlockId(input.id);
    if (!id.ok) return err(id.error);
    await deps.blocks.remove(id.value);
    return ok(undefined);
  };

export const makeListCalendarBlocks =
  (deps: CalendarBlockUseCaseDeps) =>
  async (): Promise<ReadonlyArray<CalendarBlockDto>> => {
    const blocks = await deps.blocks.list();
    return blocks.map(toDto);
  };

export type CalendarBlockUseCases = {
  readonly add: ReturnType<typeof makeAddCalendarBlock>;
  readonly remove: ReturnType<typeof makeRemoveCalendarBlock>;
  readonly list: ReturnType<typeof makeListCalendarBlocks>;
};

export const makeCalendarBlockUseCases = (
  deps: CalendarBlockUseCaseDeps,
): CalendarBlockUseCases => ({
  add: makeAddCalendarBlock(deps),
  remove: makeRemoveCalendarBlock(deps),
  list: makeListCalendarBlocks(deps),
});
