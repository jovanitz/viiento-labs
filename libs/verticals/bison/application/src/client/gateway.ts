import { defineError, type Result, type TaggedError } from '@acme/shared';
import type {
  AppointmentMove,
  CalendarBlockDates,
  ClientContactChanges,
  FillValues,
  TemplateChanges,
  TemplateColor,
  TemplateIcon,
} from '@acme/bison-domain';
import type { AppointmentDto, VisitSummaryDto } from '../agenda/dto';
import type { CalendarBlockDto } from '../agenda/blocks-use-cases';
import type { ClientDto } from '../clients/dto';
import type { TemplateBlockInput } from '../templates/use-cases';
import type { TemplateDto } from '../templates/dto';
import type { EntryDto } from '../timeline/dto';

/**
 * The client app's view of the API — one port over the `bison.*` RPC
 * surface, DTO-typed, mirroring the procedures one to one. Stores and flows
 * consume THIS, never a transport: the RPC adapter satisfies it today, and
 * the ADR-0007 offline decorator (Dexie + outbox) can wrap the same shape
 * tomorrow without a screen noticing.
 */
export const bisonGatewayError = defineError('app/bison-gateway-error');

export type BisonGatewayError =
  | TaggedError<'app/bison-gateway-error'>
  | TaggedError<'app/access-denied'>;

type Reply<T> = Promise<Result<T, BisonGatewayError>>;

export type BisonClientGateway = {
  readonly templates: {
    readonly list: () => Reply<ReadonlyArray<TemplateDto>>;
    readonly get: (input: { readonly id: string }) => Reply<TemplateDto>;
    readonly create: (input: {
      readonly name: string;
      readonly description: string;
      readonly icon: TemplateIcon;
      readonly color: TemplateColor;
      readonly blocks: ReadonlyArray<TemplateBlockInput>;
    }) => Reply<TemplateDto>;
    readonly update: (input: {
      readonly id: string;
      readonly changes: TemplateChanges;
    }) => Reply<TemplateDto>;
  };
  readonly clients: {
    readonly list: () => Reply<ReadonlyArray<ClientDto>>;
    readonly get: (input: { readonly id: string }) => Reply<ClientDto>;
    readonly create: (input: {
      readonly name: string;
      readonly phone?: string;
    }) => Reply<ClientDto>;
    readonly updateContact: (input: {
      readonly id: string;
      readonly changes: ClientContactChanges;
    }) => Reply<ClientDto>;
  };
  readonly timeline: {
    readonly list: (input: {
      readonly clientId: string;
    }) => Reply<ReadonlyArray<EntryDto>>;
    readonly log: (input: {
      readonly clientId: string;
      readonly templateId: string;
      readonly values: FillValues;
    }) => Reply<EntryDto>;
  };
  readonly files: {
    /** Returns the encoded FileRef string a `file` block's value holds. */
    readonly attach: (input: {
      readonly clientId: string;
      readonly name: string;
      readonly mime: string;
      readonly bytesBase64: string;
    }) => Reply<string>;
    readonly url: (input: {
      readonly storagePath: string;
      readonly expiresInSeconds?: number;
    }) => Reply<string>;
  };
  readonly agenda: {
    readonly list: (input: {
      readonly date: string;
    }) => Reply<ReadonlyArray<AppointmentDto>>;
    readonly book: (input: {
      readonly clientId: string;
      readonly service: string;
      readonly staffName?: string;
      readonly date: string;
      readonly startMin: number;
      readonly durationMinutes: number;
      readonly note?: string;
    }) => Reply<AppointmentDto>;
    readonly reschedule: (input: {
      readonly id: string;
      readonly move: AppointmentMove;
    }) => Reply<AppointmentDto>;
    readonly cancel: (input: { readonly id: string }) => Reply<AppointmentDto>;
    readonly visits: () => Reply<ReadonlyArray<VisitSummaryDto>>;
    readonly blocks: {
      readonly list: () => Reply<ReadonlyArray<CalendarBlockDto>>;
      readonly add: (input: {
        readonly label: string;
        readonly allDay: boolean;
        readonly startMin: number;
        readonly endMin: number;
        readonly dates: CalendarBlockDates;
      }) => Reply<CalendarBlockDto>;
      readonly remove: (input: { readonly id: string }) => Reply<void>;
    };
  };
};
