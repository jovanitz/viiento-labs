/** Pick one of the 4 Template icons — a tiny popover-free grid, since
 *  there's only ever a handful of choices. */
import { useState } from 'react';
import { Button, Popover, PopoverContent, PopoverTrigger, cn } from '@acme/ui';
import { TemplateIconGlyph } from '../identity/templates.icons';
import type { TemplateIcon } from '../templates.types';

const ICONS: readonly TemplateIcon[] = [
  'file-text',
  'stethoscope',
  'shield-check',
  'sparkles',
];

export const TemplateIconPicker = ({
  icon,
  onChange,
}: {
  readonly icon: TemplateIcon;
  readonly onChange: (icon: TemplateIcon) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Template icon"
          className="size-10 shrink-0"
        >
          <TemplateIconGlyph icon={icon} className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-1.5">
          {ICONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={cn(
                'flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary',
                option === icon && 'border-primary text-primary',
              )}
            >
              <TemplateIconGlyph icon={option} className="size-4" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
