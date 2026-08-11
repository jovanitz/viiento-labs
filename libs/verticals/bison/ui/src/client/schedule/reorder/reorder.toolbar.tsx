/**
 * Reorder control for the Schedule screen — one dropdown button. The menu
 * lists the FOUR behaviors as a single flat, described list (mode and cascade
 * variant merged, so there are no sibling control groups to confuse); the
 * button label echoes the active mode. The draft's Apply/Discard lives in the
 * floating bottom bar (reorder.apply-bar). Presentational helper of
 * schedule.view.tsx.
 */
import { ChevronDown, Shuffle } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@acme/ui';
import type { CascadeVariant, ReorderMode } from '../schedule.types';

const BUFFERS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: 'No buffer' },
  { value: 15, label: '15 min buffer' },
  { value: 30, label: '30 min buffer' },
  { value: 60, label: '1 h buffer' },
];

/** The required-gap policy knob (prototype stand-in for a Settings field). */
export const BufferSelect = ({
  minutes,
  onChange,
}: {
  readonly minutes: number;
  readonly onChange: (minutes: number) => void;
}) => (
  <Select value={String(minutes)} onValueChange={(v) => onChange(Number(v))}>
    <SelectTrigger className="h-8 w-fit gap-1 text-xs" aria-label="Buffer">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {BUFFERS.map((b) => (
        <SelectItem key={b.value} value={String(b.value)}>
          {b.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

type Choice = {
  readonly value: string;
  readonly mode: ReorderMode;
  readonly variant: CascadeVariant;
  readonly label: string;
  readonly hint: string;
};

const CHOICES: readonly Choice[] = [
  {
    value: 'free',
    mode: 'free',
    variant: 'shift-all',
    label: 'Free',
    hint: 'Place anywhere — overlaps allowed.',
  },
  {
    value: 'strict',
    mode: 'strict',
    variant: 'shift-all',
    label: 'Strict',
    hint: 'Only into free slots.',
  },
  {
    value: 'cascade:shift-all',
    mode: 'cascade',
    variant: 'shift-all',
    label: 'Cascade — shift all',
    hint: 'Later appointments move by the same amount.',
  },
  {
    value: 'cascade:push-chain',
    mode: 'cascade',
    variant: 'push-chain',
    label: 'Cascade — push chain',
    hint: 'Only colliding appointments get pushed.',
  },
];

export const ReorderControls = ({
  mode,
  variant,
  onMode,
  onVariant,
}: {
  readonly mode: 'off' | ReorderMode;
  readonly variant: CascadeVariant;
  readonly onMode: (mode: 'off' | ReorderMode) => void;
  readonly onVariant: (variant: CascadeVariant) => void;
}) => {
  let current = '';
  if (mode === 'cascade') current = `cascade:${variant}`;
  else if (mode !== 'off') current = mode;
  const active = CHOICES.find((c) => c.value === current);
  const pick = (choice: Choice) => {
    onMode(choice.mode);
    onVariant(choice.variant);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={active ? 'default' : 'outline'} size="sm">
          <Shuffle className="mr-2 size-4" />
          {active ? `Reorder · ${active.label}` : 'Reorder'}
          <ChevronDown className="ml-2 size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Reorder mode</DropdownMenuLabel>
        {CHOICES.map((c) => (
          <DropdownMenuCheckboxItem
            key={c.value}
            checked={c.value === current}
            onClick={() => pick(c)}
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">
                {c.label}
              </span>
              <span className="block text-xs text-muted-foreground">
                {c.hint}
              </span>
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        {active ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onMode('off')}>
              Done reordering
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
