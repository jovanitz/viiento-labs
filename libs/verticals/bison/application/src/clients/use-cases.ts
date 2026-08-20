import {
  type Clock,
  type IdGenerator,
  type Logger,
  type Result,
  err,
  ok,
} from '@acme/shared';
import {
  createClient,
  makeClientId,
  updateClientContact,
} from '@acme/bison-domain';
import type { ClientContactChanges } from '@acme/bison-domain';
import { type ClientDto, toClientDto } from './dto';
import { type ClientUseCaseError, clientNotFound } from './errors';
import type { ClientRepository } from './ports';

export type ClientUseCaseDeps = {
  readonly clients: ClientRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly logger: Logger;
};

export type ClientUseCaseResult = Promise<
  Result<ClientDto, ClientUseCaseError>
>;

export const makeCreateClient =
  (deps: ClientUseCaseDeps) =>
  async (input: {
    readonly name: string;
    readonly phone?: string;
  }): ClientUseCaseResult => {
    const id = makeClientId(deps.ids.next());
    if (!id.ok) return err(id.error);

    const created = createClient({
      id: id.value,
      name: input.name,
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      occurredAt: deps.clock.now().toISOString(),
    });
    if (!created.ok) return err(created.error);

    await deps.clients.save(created.value);
    deps.logger.info('bison.client.created', { clientId: created.value.id });
    return ok(toClientDto(created.value));
  };

export const makeUpdateClientContact =
  (deps: ClientUseCaseDeps) =>
  async (input: {
    readonly id: string;
    readonly changes: ClientContactChanges;
  }): ClientUseCaseResult => {
    const id = makeClientId(input.id);
    if (!id.ok) return err(id.error);

    const existing = await deps.clients.findById(id.value);
    if (!existing) {
      return err(clientNotFound(`No client with id ${input.id}.`));
    }

    const updated = updateClientContact(
      existing,
      input.changes,
      deps.clock.now().toISOString(),
    );
    if (!updated.ok) return err(updated.error);

    await deps.clients.save(updated.value);
    return ok(toClientDto(updated.value));
  };

export const makeListClients =
  (deps: ClientUseCaseDeps) => async (): Promise<ReadonlyArray<ClientDto>> => {
    const clients = await deps.clients.list();
    return clients.map(toClientDto);
  };

export const makeGetClient =
  (deps: ClientUseCaseDeps) =>
  async (input: { readonly id: string }): ClientUseCaseResult => {
    const id = makeClientId(input.id);
    if (!id.ok) return err(id.error);
    const client = await deps.clients.findById(id.value);
    if (!client) {
      return err(clientNotFound(`No client with id ${input.id}.`));
    }
    return ok(toClientDto(client));
  };

export type ClientUseCases = {
  readonly create: ReturnType<typeof makeCreateClient>;
  readonly updateContact: ReturnType<typeof makeUpdateClientContact>;
  readonly list: ReturnType<typeof makeListClients>;
  readonly get: ReturnType<typeof makeGetClient>;
};

export const makeClientUseCases = (
  deps: ClientUseCaseDeps,
): ClientUseCases => ({
  create: makeCreateClient(deps),
  updateContact: makeUpdateClientContact(deps),
  list: makeListClients(deps),
  get: makeGetClient(deps),
});
