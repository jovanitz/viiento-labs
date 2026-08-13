/**
 * Bison Manager · Client · Client Detail — a client's individual page,
 * reached by clicking their row in the roster (clients.row.tsx). The
 * Timeline (client-detail/timeline/) is the heart of the page — every
 * template entry logged for this client, grouped by day.
 *
 * @screen Bison Manager / Client / Client Detail
 * @phase draft
 */
import { ArrowLeft } from 'lucide-react';
import { Avatar, Button, Stack } from '@acme/ui';
import { TimelineView } from './timeline/timeline.view';
import type { FillValues } from './timeline/timeline.fill.logic';
import type { TimelineVM } from './timeline/timeline.types';
import type { ClientRow } from '../clients.types';

export const ClientDetailView = ({
  client,
  onBack,
  timelineVM,
  expandedEntryIds,
  onAddEntryClick,
  onToggleEntry,
  onSaveEntryFields,
}: {
  readonly client: ClientRow;
  readonly onBack: () => void;
  readonly timelineVM: TimelineVM;
  readonly expandedEntryIds: ReadonlySet<string>;
  readonly onAddEntryClick: () => void;
  readonly onToggleEntry: (id: string) => void;
  readonly onSaveEntryFields: (id: string, values: FillValues) => void;
}) => (
  <Stack gap="group" className="max-w-3xl">
    <Button
      variant="ghost"
      size="sm"
      onClick={onBack}
      className="-ml-2 w-fit text-muted-foreground"
    >
      <ArrowLeft /> Clients
    </Button>
    <div className="flex items-center gap-3">
      <Avatar fallback={client.initials} />
      <h1 className="text-xl font-semibold text-foreground">{client.name}</h1>
    </div>
    <TimelineView
      vm={timelineVM}
      expandedIds={expandedEntryIds}
      onAddClick={onAddEntryClick}
      onToggleEntry={onToggleEntry}
      onSaveEntryFields={onSaveEntryFields}
    />
  </Stack>
);
