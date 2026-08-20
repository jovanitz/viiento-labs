import type { Client, ClientId } from '@acme/bison-domain';

/** Repository port for the account's client roster. `list` returns clients
 *  ordered by name. */
export type ClientRepository = {
  readonly findById: (id: ClientId) => Promise<Client | null>;
  readonly list: () => Promise<ReadonlyArray<Client>>;
  readonly save: (client: Client) => Promise<void>;
};
