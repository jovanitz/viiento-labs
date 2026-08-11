/**
 * Floating confirmation for the reorder draft — a frosted-glass bar that
 * hovers over the grid (sticky, bottom), so the rearranged calendar stays
 * visible behind it while you accept or reject the batch. Presentational
 * helper of schedule.view.tsx.
 */
import { Button, cn, glassPanel } from '@acme/ui';

export const ApplyBar = ({
  count,
  onApply,
  onDiscard,
}: {
  readonly count: number;
  readonly onApply: () => void;
  readonly onDiscard: () => void;
}) => (
  <div
    role="alertdialog"
    aria-label="Confirm reorder changes"
    className={cn(
      'sticky bottom-4 z-20 flex items-center gap-3 justify-self-center rounded-xl border px-4 py-2.5 shadow-lg',
      glassPanel,
    )}
  >
    <p className="text-sm font-medium text-foreground">
      {count} pending change{count === 1 ? '' : 's'}
    </p>
    <Button variant="ghost" size="sm" onClick={onDiscard}>
      Discard
    </Button>
    <Button size="sm" onClick={onApply}>
      Apply
    </Button>
  </div>
);
