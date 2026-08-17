/**
 * Contact/channel fixtures for the account's named clients — phone number
 * and how each is connected on Telegram/WhatsApp. Keyed by `slugOf(name)`
 * (see clients.logic.ts) so it joins onto ANY visits-derived roster, real
 * or synthetic; a name with no entry here falls back to the "no contact on
 * file" default in deriveClients, which is the right story for the
 * generated pagination-filler clients — they were never really onboarded.
 */
import { slugOf, type ClientContact } from './clients.logic';
import type { ChannelStatus } from './clients.types';

const contact = (
  name: string,
  phone: string,
  telegram: ChannelStatus,
  whatsapp: ChannelStatus,
): readonly [string, ClientContact] => [
  slugOf(name),
  { phone, channels: { telegram, whatsapp } },
];

export const CLIENT_CONTACTS: ReadonlyMap<string, ClientContact> = new Map([
  contact('Diego Marín', '+52 33 1234 5678', 'verified', 'not_connected'),
  contact('Luis Peña', '+52 33 2345 6789', 'not_connected', 'verified'),
  contact('Óscar Gil', '+52 33 3456 7890', 'pending', 'not_connected'),
  contact('Emilio Cruz', '+52 33 4567 8901', 'verified', 'verified'),
  contact('Andrés Soto', '+52 33 5678 9012', 'verified', 'pending'),
  contact('Javier Luna', '+52 33 6789 0123', 'not_connected', 'pending'),
  contact('Iván Ríos', '+52 33 7890 1234', 'pending', 'not_connected'),
  contact('Pablo Vidal', '+52 33 8901 2345', 'not_connected', 'not_connected'),
  contact('Raúl Ortega', '+52 33 9012 3456', 'verified', 'not_connected'),
  contact('Beto Salas', '+52 33 0123 4567', 'not_connected', 'verified'),
  contact('Chuy Navarro', '+52 33 1122 3344', 'pending', 'pending'),
  contact('Memo Ávila', '+52 33 5566 7788', 'verified', 'not_connected'),
]);
