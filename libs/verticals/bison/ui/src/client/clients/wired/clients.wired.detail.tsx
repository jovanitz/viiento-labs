import { useEffect, useState } from 'react';
import { toast } from '@acme/ui';
import type { ClientDetailVM, TimelineEntryVM } from '@acme/bison-application';
import { ClientDetailView } from '../client-detail/client-detail.view';
import type { ClientDraft } from '../client-detail/client-form.fields';
import { TemplatePickerDialog } from '../client-detail/timeline/template-picker/template-picker.dialog';
import type { FillValues } from '../client-detail/timeline/fill/timeline.fill.logic';
import type {
  TimelineDay,
  TimelineEntry,
  TimelineVM,
} from '../client-detail/timeline/timeline.types';
import type { EntryTemplate } from '../../templates/templates.types';
import { EntryDocument } from '../../templates/document/document.prototype';
import { mergeFormats } from '../../templates/wired/formats.bridge';
import { FileUrlResolverProvider } from '../../templates/values/file-url-context';
import { useFormatsStore, useIdentityStore, useStore } from '../../store/hooks';
import { useIssueEntry } from './clients.wired.issue';

/**
 * The WIRED client detail: renders the same approved views as the
 * prototype's ClientDetailContainer, but its timeline comes from the store
 * and "add entry" LOGS through the `bison.*` gateway. The record is
 * append-only, so filling is one shot: picking a template opens a local
 * DRAFT entry (unsaved, expanded); saving it logs the fill. Editing an
 * already-logged entry is not available yet — corrections will arrive as
 * new entries.
 */
const DRAFT_ID = 'draft';

const toUiEntry = (entry: TimelineEntryVM): TimelineEntry => ({
  id: entry.id,
  templateId: entry.templateId,
  templateName: entry.templateName,
  icon: entry.icon,
  at: new Date(entry.at),
  timeLabel: entry.timeLabel,
  summary: entry.summary,
  fields: entry.fields,
});

const draftEntry = (template: EntryTemplate): TimelineEntry => {
  const now = new Date();
  return {
    id: DRAFT_ID,
    templateId: template.id,
    templateName: template.name,
    icon: template.icon,
    at: now,
    timeLabel: now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    summary: '',
    fields: [],
  };
};

const todayLabel = (): string =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

const toTimelineVM = (
  detail: ClientDetailVM,
  templates: readonly EntryTemplate[],
  draft: TimelineEntry | null,
): TimelineVM => {
  const days: TimelineDay[] = detail.days.map((day) => ({
    dateLabel: day.dateLabel,
    entries: day.entries.map(toUiEntry),
  }));
  if (draft) {
    const label = todayLabel();
    const first = days[0];
    if (first && first.dateLabel === label) {
      days[0] = { ...first, entries: [draft, ...first.entries] };
    } else {
      days.unshift({ dateLabel: label, entries: [draft] });
    }
  }
  return { days, templates, empty: !draft && detail.timelineEmpty };
};

/** The entry being printed, with its template and blockId-keyed values —
 *  all or nothing, so the caller has one thing to test. */
const documentTarget = (
  detail: ClientDetailVM,
  templates: readonly EntryTemplate[],
  entryId: string | undefined,
) => {
  const entry = detail.days
    .flatMap((day) => day.entries)
    .find((candidate) => candidate.id === entryId);
  const template = templates.find((t) => t.id === entry?.templateId);
  if (!entry || !template) return undefined;
  const values = Object.fromEntries(
    entry.fields.map((field) => [field.blockId, field.value]),
  );
  return { entryId: entry.id, template, values };
};

type LogEntryInput = {
  readonly templateId: string;
  readonly values: FillValues;
};

/** The draft-then-log timeline state: which entry is the unsaved draft,
 *  which entries are open, and the picker. Split out so the component
 *  reads as wiring rather than a pile of useState. */
const useDraftTimeline = (
  onLogEntry: (input: LogEntryInput) => Promise<boolean>,
) => {
  const [draft, setDraft] = useState<TimelineEntry | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  return {
    draft,
    pickerOpen,
    setPickerOpen,
    expandedIds,
    toggle: (id: string) =>
      setExpandedIds((ids) => {
        const next = new Set(ids);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    pick: (template: EntryTemplate) => {
      setDraft(draftEntry(template));
      setExpandedIds(new Set([DRAFT_ID]));
      setPickerOpen(false);
      toast.success(`"${template.name}" ready to fill`);
    },
    saveFields: async (entryId: string, values: FillValues) => {
      if (entryId !== DRAFT_ID) {
        toast.info(
          'Editing a logged entry is not available yet — the record is append-only.',
        );
        return;
      }
      if (!draft) return;
      const logged = await onLogEntry({
        templateId: draft.templateId,
        values,
      });
      if (logged) {
        setDraft(null);
        toast.success('Entry logged to the timeline');
      }
    },
  };
};

export const WiredClientDetail = ({
  detail,
  onBack,
  onSaveContact,
  onLogEntry,
  onResolveFileUrl,
}: {
  readonly detail: ClientDetailVM;
  readonly onBack: () => void;
  readonly onSaveContact: (draft: ClientDraft) => Promise<boolean>;
  readonly onLogEntry: (input: LogEntryInput) => Promise<boolean>;
  /** Signed-URL resolver for stored file values (downloads). */
  readonly onResolveFileUrl: (storagePath: string) => Promise<string | null>;
}) => {
  const templates = detail.templates as readonly EntryTemplate[];
  const timeline = useDraftTimeline(onLogEntry);
  const [documentEntryId, setDocumentEntryId] = useState<string>();
  const formatsStore = useFormatsStore();
  const storedFormats = useStore(formatsStore, (s) => s.formats);
  const identityStore = useIdentityStore();
  const accountTokens = useStore(identityStore, (s) => s.tokens);
  useEffect(() => {
    void formatsStore.getState().load();
    void identityStore.getState().load();
  }, [formatsStore, identityStore]);
  const formats = mergeFormats(storedFormats ?? []);

  const target = documentTarget(detail, templates, documentEntryId);
  const onIssuePdf = useIssueEntry(target, storedFormats);
  if (target)
    return (
      <FileUrlResolverProvider resolver={onResolveFileUrl}>
        <EntryDocument
          template={target.template}
          formats={formats}
          values={target.values}
          account={accountTokens ?? {}}
          clientName={detail.client.name}
          onBack={() => setDocumentEntryId(undefined)}
          onIssuePdf={onIssuePdf}
        />
      </FileUrlResolverProvider>
    );

  return (
    <FileUrlResolverProvider resolver={onResolveFileUrl}>
      <ClientDetailView
        client={detail.client}
        onBack={onBack}
        timelineVM={toTimelineVM(detail, templates, timeline.draft)}
        expandedEntryIds={timeline.expandedIds}
        onAddEntryClick={() => timeline.setPickerOpen(true)}
        onToggleEntry={timeline.toggle}
        onSaveEntryFields={(id, values) => void timeline.saveFields(id, values)}
        onOpenEntryDocument={setDocumentEntryId}
        onSaveIdentity={(identity) => void onSaveContact(identity)}
        onCycleChannel={() =>
          toast.info('Channel linking arrives with the messaging feature.')
        }
      />
      <TemplatePickerDialog
        open={timeline.pickerOpen}
        onOpenChange={timeline.setPickerOpen}
        templates={templates}
        onSelectTemplate={timeline.pick}
      />
    </FileUrlResolverProvider>
  );
};
