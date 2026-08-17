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
import { Button, Stack } from '@acme/ui';
import { ClientIdentityHeader } from './client-identity.header';
import type { ClientDraft } from './client-form.fields';
import { TimelineView } from './timeline/timeline.view';
import type { FillValues } from './timeline/timeline.fill.logic';
import type { TimelineVM } from './timeline/timeline.types';
import type { ClientChannels, ClientRow } from '../clients.types';

export const ClientDetailView = ({
  client,
  onBack,
  timelineVM,
  expandedEntryIds,
  onAddEntryClick,
  onToggleEntry,
  onSaveEntryFields,
  onSaveIdentity,
  onCycleChannel,
}: {
  readonly client: ClientRow;
  readonly onBack: () => void;
  readonly timelineVM: TimelineVM;
  readonly expandedEntryIds: ReadonlySet<string>;
  readonly onAddEntryClick: () => void;
  readonly onToggleEntry: (id: string) => void;
  readonly onSaveEntryFields: (id: string, values: FillValues) => void;
  readonly onSaveIdentity: (draft: ClientDraft) => void;
  readonly onCycleChannel: (channel: keyof ClientChannels) => void;
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
    <ClientIdentityHeader
      client={client}
      onSaveIdentity={onSaveIdentity}
      onCycleChannel={onCycleChannel}
    />
    <TimelineView
      vm={timelineVM}
      expandedIds={expandedEntryIds}
      onAddClick={onAddEntryClick}
      onToggleEntry={onToggleEntry}
      onSaveEntryFields={onSaveEntryFields}
    />
  </Stack>
);
