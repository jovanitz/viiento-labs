import { type Brand, type Result, err, ok } from '@acme/shared';
import { invalidClientId, invalidClientName } from './errors';
import type { ClientDomainError } from './errors';

/**
 * The Client entity — one person the account serves. Individual-account
 * scope: the client belongs to the account, and every appointment/entry
 * that references it is implicitly the account's own.
 *
 * Channels record how the client's messaging is connected (the
 * conversational interface is the product's main door); a client is born
 * with nothing connected, and the verification transitions arrive with the
 * messaging feature — not here.
 */

export type ClientId = Brand<string, 'ClientId'>;

export const makeClientId = (
  raw: string,
): Result<ClientId, ClientDomainError> => {
  const value = raw.trim();
  if (value.length === 0) {
    return err(invalidClientId('Client id must not be empty.'));
  }
  return ok(value as ClientId);
};

export type ChannelStatus = 'not_connected' | 'pending' | 'verified';

export type ClientChannels = {
  readonly telegram: ChannelStatus;
  readonly whatsapp: ChannelStatus;
};

export const NO_CHANNELS: ClientChannels = {
  telegram: 'not_connected',
  whatsapp: 'not_connected',
};

export type Client = {
  readonly id: ClientId;
  readonly name: string;
  /** Empty when there's none on file — consumers render a fallback. */
  readonly phone: string;
  readonly photoUrl?: string | undefined;
  readonly channels: ClientChannels;
  readonly createdAt: string;
  readonly updatedAt: string;
};

const CLIENT_NAME_MAX = 120;

const makeName = (raw: string): Result<string, ClientDomainError> => {
  const value = raw.trim();
  if (value.length === 0) {
    return err(invalidClientName('Client name must not be empty.'));
  }
  if (value.length > CLIENT_NAME_MAX) {
    return err(
      invalidClientName(
        `Client name must be at most ${CLIENT_NAME_MAX} characters.`,
        { details: { length: value.length, max: CLIENT_NAME_MAX } },
      ),
    );
  }
  return ok(value);
};

export const createClient = (input: {
  readonly id: ClientId;
  readonly name: string;
  readonly phone?: string;
  readonly occurredAt: string;
}): Result<Client, ClientDomainError> => {
  const name = makeName(input.name);
  if (!name.ok) return err(name.error);
  return ok({
    id: input.id,
    name: name.value,
    phone: (input.phone ?? '').trim(),
    channels: NO_CHANNELS,
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });
};

export type ClientContactChanges = {
  readonly name?: string;
  readonly phone?: string;
};

export const updateClientContact = (
  client: Client,
  changes: ClientContactChanges,
  occurredAt: string,
): Result<Client, ClientDomainError> => {
  const name = makeName(changes.name ?? client.name);
  if (!name.ok) return err(name.error);
  return ok({
    ...client,
    name: name.value,
    phone: (changes.phone ?? client.phone).trim(),
    updatedAt: occurredAt,
  });
};

/** 1-2 letters for an avatar fallback — pure derivation, no locale magic. */
export const clientInitials = (name: string): string => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  if (words.length === 0) return '?';
  const first = words[0]?.charAt(0) ?? '';
  const second = words.length > 1 ? (words[1]?.charAt(0) ?? '') : '';
  return (first + second).toUpperCase();
};
