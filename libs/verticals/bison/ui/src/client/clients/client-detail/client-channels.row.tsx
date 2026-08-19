/**
 * Client Detail — the Telegram/WhatsApp connection badges. Not a form:
 * each badge is a button that advances its own state (see
 * clients.logic.ts's `nextChannelStatus`) instead of opening an input,
 * since a real channel link is a flow (bot handshake, QR, WhatsApp
 * Business auth), not typed data. Split out of client-identity.header.tsx
 * to keep that file under the size sensor's line limit.
 */
import type { ReactNode } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Badge } from '@acme/ui';
import type { ChannelStatus, ClientChannels } from '../clients.types';

export const CHANNEL_LABEL: Record<ChannelStatus, string> = {
  verified: 'Verified',
  pending: 'Pending',
  not_connected: 'Not connected',
};

export const CHANNEL_VARIANT: Record<
  ChannelStatus,
  'success' | 'warning' | 'secondary'
> = {
  verified: 'success',
  pending: 'warning',
  not_connected: 'secondary',
};

const ChannelButton = ({
  icon,
  name,
  status,
  onClick,
}: {
  readonly icon: ReactNode;
  readonly name: string;
  readonly status: ChannelStatus;
  readonly onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-full transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <Badge variant={CHANNEL_VARIANT[status]} appearance="soft" dot>
      {icon}
      {name} · {CHANNEL_LABEL[status]}
    </Badge>
  </button>
);

export const ChannelsRow = ({
  channels,
  onCycleChannel,
}: {
  readonly channels: ClientChannels;
  readonly onCycleChannel: (channel: keyof ClientChannels) => void;
}) => (
  <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:pt-1">
    <ChannelButton
      icon={<Send className="size-3" />}
      name="Telegram"
      status={channels.telegram}
      onClick={() => onCycleChannel('telegram')}
    />
    <ChannelButton
      icon={<MessageCircle className="size-3" />}
      name="WhatsApp"
      status={channels.whatsapp}
      onClick={() => onCycleChannel('whatsapp')}
    />
  </div>
);
