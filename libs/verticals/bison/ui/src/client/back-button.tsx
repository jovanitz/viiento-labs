/**
 * The one back affordance every drill-down screen uses. One component so
 * the arrow, gap and type are identical everywhere — four hand-rolled
 * copies is how they drift out of alignment. Same quiet recipe as inline
 * actions: 14px glyph beside 12px text, muted until hover.
 */
import { ArrowLeft } from 'lucide-react';
import { Button } from '@acme/ui';

export const BackButton = ({
  label,
  onClick,
}: {
  readonly label: string;
  readonly onClick: () => void;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    className="-ml-2 w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
  >
    {/* The half-pixel nudge is optical: a label's visual centre (cap
        height) sits below its line-box centre, so a geometrically
        centred arrow reads as floating high. */}
    <ArrowLeft className="translate-y-[0.5px]" /> {label}
  </Button>
);
