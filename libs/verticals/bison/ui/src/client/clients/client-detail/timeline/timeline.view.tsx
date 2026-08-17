/**
 * Bison Manager · Client · Client Detail · Timeline — the running record for
 * one client, on one continuous rail line: a dot marks each day, an icon
 * node marks each entry logged that day. "Add entry" opens the template
 * picker; picking a template attaches it immediately, blank; clicking a
 * logged entry expands its content inline, right in the timeline (no
 * modal/sheet) — including editing it, via that entry's Edit button.
 * Presentational: a pure function of the VM (same discipline as
 * clients.view.tsx).
 *
 * @screen Bison Manager / Client / Client Detail / Timeline
 * @phase draft
 */
import { Fragment } from 'react';
import { Plus } from 'lucide-react';
import { Button, EmptyState, Stack } from '@acme/ui';
import { EntryRow } from './timeline.entry';
import type { FillValues } from './timeline.fill.logic';
import type { TimelineVM } from './timeline.types';

const DayMarker = ({ label }: { readonly label: string }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex size-8 shrink-0 items-center justify-center">
      <span className="relative z-10 size-2 rounded-full bg-primary" />
    </div>
    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
      {label}
    </p>
  </div>
);

const Rail = ({
  vm,
  expandedIds,
  onToggleEntry,
  onSaveEntryFields,
}: {
  readonly vm: TimelineVM;
  readonly expandedIds: ReadonlySet<string>;
  readonly onToggleEntry: (id: string) => void;
  readonly onSaveEntryFields: (id: string, values: FillValues) => void;
}) => (
  <div className="relative">
    <div aria-hidden className="absolute inset-y-4 left-4 w-px bg-border" />
    <div className="flex flex-col">
      {vm.days.map((day) => (
        <Fragment key={day.dateLabel}>
          <DayMarker label={day.dateLabel} />
          {day.entries.map((entry) => {
            const template = vm.templates.find(
              (t) => t.id === entry.templateId,
            );
            return (
              <EntryRow
                key={entry.id}
                entry={entry}
                blocks={template?.blocks ?? []}
                expanded={expandedIds.has(entry.id)}
                onToggle={() => onToggleEntry(entry.id)}
                onSaveFields={(values) => onSaveEntryFields(entry.id, values)}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  </div>
);

export const TimelineView = ({
  vm,
  expandedIds,
  onAddClick,
  onToggleEntry,
  onSaveEntryFields,
}: {
  readonly vm: TimelineVM;
  readonly expandedIds: ReadonlySet<string>;
  readonly onAddClick: () => void;
  readonly onToggleEntry: (id: string) => void;
  readonly onSaveEntryFields: (id: string, values: FillValues) => void;
}) => (
  <Stack gap="group">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
      <Button size="sm" onClick={onAddClick}>
        <Plus /> Add entry
      </Button>
    </div>
    {vm.empty ? (
      <EmptyState
        icon={<Plus />}
        title="Nothing logged yet"
        description="Add an entry from a template to start this client's record."
      />
    ) : (
      <Rail
        vm={vm}
        expandedIds={expandedIds}
        onToggleEntry={onToggleEntry}
        onSaveEntryFields={onSaveEntryFields}
      />
    )}
  </Stack>
);
