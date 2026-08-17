import {
  forwardRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '../cn';
import { Button } from '../button/button';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../command/command';

export type ComboboxOption = { readonly value: string; readonly label: string };

export type ComboboxProps = {
  readonly options: readonly ComboboxOption[];
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly empty?: ReactNode;
  readonly className?: string;
  /** Offers "Create '<query>'" whenever the search text doesn't match an
   *  existing option — e.g. adding a new client while booking, instead of
   *  being limited to a fixed picklist. Omit to disable (the default). */
  readonly onCreate?: (query: string) => void;
  readonly createLabel?: (query: string) => ReactNode;
};

const CreateItem = ({
  query,
  label,
  onSelect,
}: {
  readonly query: string;
  readonly label: ReactNode;
  readonly onSelect: () => void;
}) => (
  <CommandGroup>
    <CommandItem value={`__create__${query}`} onSelect={onSelect}>
      <Plus className="size-4" />
      {label}
    </CommandItem>
  </CommandGroup>
);

const ComboboxTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof Button> & {
    readonly open: boolean;
    readonly selected: ComboboxOption | undefined;
    readonly placeholder: string;
  }
>(({ open, selected, placeholder, className, ...rest }, ref) => (
  <Button
    ref={ref}
    variant="outline"
    role="combobox"
    aria-expanded={open}
    className={cn('w-56 justify-between font-normal', className)}
    {...rest}
  >
    <span className={cn('truncate', !selected && 'text-muted-foreground')}>
      {selected ? selected.label : placeholder}
    </span>
    <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
  </Button>
));
ComboboxTrigger.displayName = 'ComboboxTrigger';

const OptionsGroup = ({
  options,
  value,
  onSelect,
}: {
  readonly options: readonly ComboboxOption[];
  readonly value: string | undefined;
  readonly onSelect: (option: ComboboxOption) => void;
}) => (
  <CommandGroup>
    {options.map((o) => (
      <CommandItem key={o.value} value={o.label} onSelect={() => onSelect(o)}>
        <Check
          className={cn(
            'size-4',
            o.value === value ? 'opacity-100' : 'opacity-0',
          )}
        />
        {o.label}
      </CommandItem>
    ))}
  </CommandGroup>
);

/**
 * Combobox = Popover + Command (searchable select). Presentational recipe over
 * the existing primitives — no new dependency. Controlled via value/onChange;
 * selecting the current value again clears it.
 */
export const Combobox = ({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  empty = 'No results.',
  className,
  onCreate,
  createLabel = (query) => `Create "${query}"`,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.value === value);
  const trimmed = query.trim();
  const canCreate =
    onCreate !== undefined &&
    trimmed !== '' &&
    !options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());

  const selectOption = (o: ComboboxOption) => {
    onChange?.(o.value === value ? '' : o.value);
    setOpen(false);
  };

  const create = () => {
    onCreate?.(trimmed);
    setQuery('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ComboboxTrigger
          open={open}
          selected={selected}
          placeholder={placeholder}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{empty}</CommandEmpty>
            {canCreate ? (
              <CreateItem
                query={trimmed}
                label={createLabel(trimmed)}
                onSelect={create}
              />
            ) : null}
            <OptionsGroup
              options={options}
              value={value}
              onSelect={selectOption}
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
