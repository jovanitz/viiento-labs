/**
 * Settings · Messaging — the ACCOUNT's own channel connections, the
 * business side of the per-client badges on a client's detail header.
 * Same simulation as client-channels.row.tsx: connecting a channel is a
 * flow (bot handshake, WhatsApp Business auth), not typed data, so each
 * status badge is a button that advances the state — reusing that file's
 * label/variant maps so both surfaces always read the same.
 */
import type { ReactNode } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@acme/ui';
import {
  CHANNEL_LABEL,
  CHANNEL_VARIANT,
} from '../clients/client-detail/client-channels.row';
import type { ChannelStatus, ClientChannels } from '../clients/clients.types';

const ChannelSettingsRow = ({
  icon,
  name,
  description,
  status,
  onCycle,
}: {
  readonly icon: ReactNode;
  readonly name: string;
  readonly description: string;
  readonly status: ChannelStatus;
  readonly onCycle: () => void;
}) => (
  <div className="flex items-center gap-3">
    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <button
      type="button"
      onClick={onCycle}
      className="shrink-0 rounded-full transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Badge variant={CHANNEL_VARIANT[status]} appearance="soft" dot>
        {CHANNEL_LABEL[status]}
      </Badge>
    </button>
  </div>
);

export const MessagingCard = ({
  channels,
  onCycleChannel,
}: {
  readonly channels: ClientChannels;
  readonly onCycleChannel: (channel: keyof ClientChannels) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Messaging</CardTitle>
      <CardDescription>
        The channels this account uses to reach clients.
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      <ChannelSettingsRow
        icon={<Send className="size-4" />}
        name="Telegram"
        description="Link a Telegram bot for booking updates and reminders."
        status={channels.telegram}
        onCycle={() => onCycleChannel('telegram')}
      />
      <ChannelSettingsRow
        icon={<MessageCircle className="size-4" />}
        name="WhatsApp"
        description="Link your WhatsApp number for client messages."
        status={channels.whatsapp}
        onCycle={() => onCycleChannel('whatsapp')}
      />
    </CardContent>
  </Card>
);
