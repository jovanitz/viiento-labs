/**
 * Client roster row — avatar initials, name, visit count and their most
 * recent visit. Presentational helper of clients.view.tsx. Clicking a row
 * navigates to that client's individual view (client-detail/).
 */
import { Avatar, Card } from '@acme/ui';
import type { ClientRow } from './clients.types';

const Row = ({
  client,
  onSelectClient,
}: {
  readonly client: ClientRow;
  readonly onSelectClient?: ((id: string) => void) | undefined;
}) => (
  <li className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
    <button
      type="button"
      onClick={() => onSelectClient?.(client.id)}
      className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Avatar fallback={client.initials} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {client.name}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {client.latestVisitLabel}
        </p>
      </div>
      <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {client.visitCount} visit{client.visitCount === 1 ? '' : 's'}
      </p>
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
  <Card className="overflow-hidden">
    <ul className="divide-y divide-border">
      {clients.map((client) => (
        <Row key={client.id} client={client} onSelectClient={onSelectClient} />
      ))}
    </ul>
  </Card>
);
