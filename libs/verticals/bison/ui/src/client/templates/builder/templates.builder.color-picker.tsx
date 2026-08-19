/**
 * The template's accent color — a closed row of swatches (the palette is
 * ours, the business only picks). Sits beside the icon picker: icon and
 * color together are the template's face everywhere.
 */
import { cn } from '@acme/ui';
import { COLOR_CLASSES, TEMPLATE_COLORS } from '../identity/templates.colors';
import type { TemplateColor } from '../identity/templates.colors';

export const TemplateColorPicker = ({
  color,
  onChange,
}: {
  readonly color: TemplateColor;
  readonly onChange: (color: TemplateColor) => void;
}) => (
  <div
    className="flex items-center gap-1.5"
    role="radiogroup"
    aria-label="Accent color"
  >
    {TEMPLATE_COLORS.map((option) => (
      <button
        key={option}
        type="button"
        role="radio"
        aria-checked={option === color}
        aria-label={option}
        onClick={() => onChange(option)}
        className={cn(
          'size-5 rounded-full transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          COLOR_CLASSES[option].swatch,
          option === color
            ? 'scale-110 ring-2 ring-ring ring-offset-2 ring-offset-background'
            : 'hover:scale-110',
        )}
      />
    ))}
  </div>
);
