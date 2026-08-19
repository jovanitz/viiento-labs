/**
 * Preview — the template as it will actually appear on a client's
 * timeline: the just-attached entry, expanded, blank, with the same
 * inputs filling it in will use. Built from the SAME pieces the timeline
 * renders (TemplateFillField, isFillValid, summaryFrom), so this preview
 * cannot drift from the real thing.
 *
 * Interactive on purpose: typing shows the live summary line and the
 * Save-enablement exactly as they will behave. Nothing typed here is
 * kept — it is a preview, not an entry.
 */
import { useState } from 'react';
import { Button } from '@acme/ui';
import { TemplateIconBadge } from '../identity/templates.icons';
import { FillFormRows } from '../../clients/client-detail/timeline/fill/timeline.fill.field';
import {
  isFillValid,
  summaryFrom,
} from '../../clients/client-detail/timeline/fill/timeline.fill.logic';
import type { FillValues } from '../../clients/client-detail/timeline/fill/timeline.fill.logic';
import type {
  TemplateBlock,
  TemplateColor,
  TemplateIcon,
} from '../templates.types';

const EntryHeaderMock = ({
  name,
  icon,
  color,
  summary,
}: {
  readonly name: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  readonly summary: string;
}) => (
  <div className="flex items-start gap-3">
    <TemplateIconBadge
      icon={icon}
      color={color}
      className="relative z-10 size-8"
    />
    <div className="min-w-0 flex-1 px-2 py-1">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-foreground">
          {name.trim() === '' ? 'Untitled template' : name}
        </p>
        <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
          Now
        </p>
      </div>
      <p className="truncate text-sm text-muted-foreground">{summary}</p>
    </div>
  </div>
);

export const BuilderTimelinePreview = ({
  name,
  icon,
  color,
  blocks,
}: {
  readonly name: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  readonly blocks: readonly TemplateBlock[];
}) => {
  const [values, setValues] = useState<FillValues>({});

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        The entry as it will appear on a client&rsquo;s timeline, freshly
        attached. Try filling it in — nothing you type here is kept.
      </p>
      <div className="relative rounded-lg border border-border p-3">
        {/* The rail line, so it reads as the timeline it previews. */}
        <div aria-hidden className="absolute inset-y-3 left-7 w-px bg-border" />
        <EntryHeaderMock
          name={name}
          icon={icon}
          color={color}
          summary={summaryFrom(blocks, values)}
        />
        <div className="flex flex-col gap-3 pb-1 pl-11 pt-3">
          <FillFormRows
            blocks={blocks}
            values={values}
            onChange={(id, value) => setValues((v) => ({ ...v, [id]: value }))}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!isFillValid(blocks, values)}
            >
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
