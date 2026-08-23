import type { Client, ClientChannels } from '@acme/bison-domain';
import { clientInitials } from '@acme/bison-domain';

/** The client as the UI (and the RPC edge) sees it — brands erased,
 *  avatar initials pre-derived. */
export type ClientDto = {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly phone: string;
  /** Storage path of the photo on file (never a URL) — readers resolve a
   *  signed URL at the edge. */
  readonly photoPath?: string | undefined;
  readonly channels: ClientChannels;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export const toClientDto = (client: Client): ClientDto => ({
  id: client.id,
  name: client.name,
  initials: clientInitials(client.name),
  phone: client.phone,
  photoPath: client.photoPath,
  channels: client.channels,
  createdAt: client.createdAt,
  updatedAt: client.updatedAt,
});
