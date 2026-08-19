/**
 * Bison Manager · Client · Templates · Document preview — a template's
 * printed form (ADR-0020). The page itself is drawn by render/; this view
 * is the shell around it.
 *
 * It serves two situations and the props say which one you are in:
 *   · DESIGN TIME (from Templates) — `sample` is set, so the sample
 *     toggle shows and there is no Issue action. There is nothing to
 *     issue: a template holds no values.
 *   · ISSUE TIME (from a Timeline entry) — no `sample`, and `onIssue` is
 *     supplied, because now there IS a filled entry behind the page.
 *
 * Presentational: a pure function of (vm, actions). It renders pages it
 * was handed — it never paginates, resolves a value or decides whether a
 * document can be issued. All of that is data on the ViewModel.
 *
 * @screen Bison Manager / Client / Templates / Document preview
 * @phase draft
 */
import { FileWarning, Printer } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Stack,
  ToggleGroup,
  ToggleGroupItem,
} from '@acme/ui';
import { DocumentPageSurface } from './render/document.page';
import type { DocumentPreviewVM, DocumentVM } from './document.types';

/** Pixels per point. 1.0 renders Letter at 612px — a page reads at real
 *  proportions on a laptop without a zoom control to get wrong. */
const PREVIEW_SCALE = 1;

const Blockers = ({
  blockers,
}: {
  readonly blockers: DocumentPreviewVM['blockers'];
}) => (
  <Alert variant="warning">
    <FileWarning />
    <AlertTitle>Not ready to issue</AlertTitle>
    <AlertDescription>
      <ul className="list-disc pl-4">
        {blockers.map((b) => (
          <li key={b.id}>{b.message}</li>
        ))}
      </ul>
    </AlertDescription>
  </Alert>
);

const Pages = ({
  doc,
  scale,
}: {
  readonly doc: DocumentVM;
  readonly scale: number;
}) => (
  // `w-max` matters: centring alone would clip the page's left edge on a
  // viewport narrower than the paper, with no way to scroll back to it.
  // Sized to its content, the page centres when it fits and scrolls from
  // its own left edge when it does not.
  <div className="mx-auto flex w-max flex-col items-center gap-6 rounded-lg bg-muted/40 p-6">
    {doc.pages.map((page, i) => (
      <DocumentPageSurface
        key={i}
        doc={doc}
        page={page}
        pageIndex={i}
        pageCount={doc.pages.length}
        scale={scale}
      />
    ))}
  </div>
);

const Toolbar = ({
  vm,
  onIssue,
  onSampleChange,
}: {
  readonly vm: DocumentPreviewVM;
  readonly onIssue?: (() => void) | undefined;
  readonly onSampleChange?: ((s: 'typical' | 'stress') => void) | undefined;
}) => (
  <div className="flex items-center gap-2">
    {vm.sample && onSampleChange ? (
      <ToggleGroup
        type="single"
        size="sm"
        value={vm.sample}
        onValueChange={(v) =>
          v ? onSampleChange(v as 'typical' | 'stress') : undefined
        }
      >
        <ToggleGroupItem value="typical">Typical</ToggleGroupItem>
        <ToggleGroupItem value="stress">Longest</ToggleGroupItem>
      </ToggleGroup>
    ) : null}
    {onIssue ? (
      <Button size="sm" onClick={onIssue} disabled={vm.blockers.length > 0}>
        <Printer /> Issue
      </Button>
    ) : null}
  </div>
);

const SAMPLE_NOTE: Record<'typical' | 'stress', string> = {
  typical: 'Sample values — this is a layout preview, not a client’s record.',
  stress: 'Showing the longest values a field can plausibly hold.',
};

export const DocumentPreviewView = ({
  vm,
  onIssue,
  onSampleChange,
  scale = PREVIEW_SCALE,
}: {
  readonly vm: DocumentPreviewVM;
  readonly onIssue?: (() => void) | undefined;
  readonly onSampleChange?: ((s: 'typical' | 'stress') => void) | undefined;
  readonly scale?: number | undefined;
}) => {
  return (
    <Stack gap="section">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {vm.document.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {vm.document.theme.name} · {vm.document.paper} ·{' '}
            {vm.document.pages.length}{' '}
            {vm.document.pages.length === 1 ? 'page' : 'pages'}
          </p>
        </div>
        <Toolbar vm={vm} onIssue={onIssue} onSampleChange={onSampleChange} />
      </div>

      {vm.blockers.length > 0 ? <Blockers blockers={vm.blockers} /> : null}

      {vm.sample ? (
        <p className="text-xs text-muted-foreground">
          {SAMPLE_NOTE[vm.sample]}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <Pages doc={vm.document} scale={scale} />
      </div>
    </Stack>
  );
};
