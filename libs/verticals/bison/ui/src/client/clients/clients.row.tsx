/**
 * Client roster row — photo/initials avatar, name with channel-status
 * icons, latest visit, phone (wide screens), a visit-count pill and a
 * chevron affordance. Presentational helper of clients.view.tsx. Clicking
 * a row navigates to that client's individual view (client-detail/).
 * Channel icons show only VERIFIED connections — anything less is
 * silence, not a gray badge, so the roster stays scannable. Each icon
 * wears its app's brand color (not a theme token — it names a
 * third-party app, so it stays fixed across themes).
 */
import { ChevronRight, MessageCircle, Send } from 'lucide-react';
import { Avatar, Badge, Card, cn } from '@acme/ui';
import type { ClientChannels, ClientRow } from './clients.types';

const CHANNELS = [
  ['telegram', Send, 'Telegram', 'text-[#229ed9]'],
  ['whatsapp', MessageCircle, 'WhatsApp', 'text-[#25d366]'],
] as const;

const ChannelIcons = ({ channels }: { readonly channels: ClientChannels }) => (
  <span className="flex shrink-0 items-center gap-1">
    {CHANNELS.map(([key, Icon, label, brand]) => {
      if (channels[key] !== 'verified') return null;
      return (
        <Icon
          key={key}
          aria-label={`${label} connected`}
          className={cn('size-3.5', brand)}
        />
      );
    })}
  </span>
);

const Row = ({
  client,
  onSelectClient,
}: {
  readonly client: ClientRow;
  readonly onSelectClient?: ((id: string) => void) | undefined;
}) => (
  <li>
    <button
      type="button"
      onClick={() => onSelectClient?.(client.id)}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Avatar src={client.photoUrl} fallback={client.initials} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-foreground">
            {client.name}
          </span>
          <ChannelIcons channels={client.channels} />
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {client.latestVisitLabel || 'No visits yet'}
        </span>
      </span>
      {client.phone ? (
        <span className="hidden shrink-0 text-xs text-muted-foreground lg:block">
          {client.phone}
        </span>
      ) : null}
      <Badge
        variant="secondary"
        appearance="soft"
        className="shrink-0 normal-case tabular-nums"
      >
        {client.visitCount} visit{client.visitCount === 1 ? '' : 's'}
      </Badge>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
    </button>
  </li>
);

export const ClientList = ({
  clients,
  onSelectClient,
}: {
  readonly clients: readonly ClientRow[];
  readonly onSelectClient?: ((id: string) => void) | undefined;
}) => (
  <Card className="p-1.5">
    <ul className="flex flex-col">
      {clients.map((client) => (
        <Row key={client.id} client={client} onSelectClient={onSelectClient} />
      ))}
    </ul>
  </Card>
);
