/**
 * Client roster row — avatar initials, name, visit count and their most
 * recent visit. Presentational helper of clients.view.tsx.
 */
import { Avatar, Card } from '@acme/ui';
import type { ClientRow } from './clients.types';

const Row = ({ client }: { readonly client: ClientRow }) => (
  <li className="flex items-center gap-3 px-4 py-3">
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
  </li>
);

export const ClientList = ({
  clients,
}: {
  readonly clients: readonly ClientRow[];
}) => (
  <Card className="overflow-hidden">
    <ul className="divide-y divide-border">
      {clients.map((client) => (
        <Row key={client.id} client={client} />
      ))}
    </ul>
  </Card>
);
