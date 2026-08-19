/**
 * Presentational bits of one timeline entry — the header row, the quiet
 * inline actions, the read-mode field, and the accent-edged expanded
 * area. Split from timeline.entry.tsx purely to keep each file small;
 * EntryRow composes them.
 */
import { ChevronDown } from 'lucide-react';
import { Button, cn } from '@acme/ui';
import { COLOR_CLASSES } from '../../../templates/identity/templates.colors';
import type { TemplateColor } from '../../../templates/templates.types';
import { FileValueDisplay } from './fill/timeline.fill.file';
import { decodeFileValue } from '../../../templates/values/file-value';
import type { TimelineEntry } from './timeline.types';

export const Field = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="text-sm text-foreground">
      {/* A captured file reads as its preview, never as its encoding. */}
      {decodeFileValue(value) ? <FileValueDisplay value={value} /> : value}
    </dd>
  </div>
);

export const EntryHeader = ({
  entry,
  expanded,
  onClick,
}: {
  readonly entry: TimelineEntry;
  readonly expanded: boolean;
  readonly onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={expanded}
    className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-foreground">
          {entry.templateName}
        </p>
        <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {entry.timeLabel}
        </p>
      </div>
      <p className="truncate text-sm text-muted-foreground">{entry.summary}</p>
    </div>
    <ChevronDown
      className={cn(
        'size-4 shrink-0 text-muted-foreground transition-transform',
        expanded && 'rotate-180',
      )}
    />
  </button>
);

export const QuietAction = ({
  onClick,
  children,
}: {
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    className="h-7 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
    onClick={onClick}
  >
    {children}
  </Button>
);

/** Expanded content carries its template's accent as a left edge, so a
 *  long open entry stays visually tied to the icon that named it. */
export const ExpandedArea = ({
  color,
  children,
}: {
  readonly color: TemplateColor;
  readonly children: React.ReactNode;
}) => (
  <div className={cn('ml-1 border-l-2', COLOR_CLASSES[color].edge)}>
    {children}
  </div>
);
