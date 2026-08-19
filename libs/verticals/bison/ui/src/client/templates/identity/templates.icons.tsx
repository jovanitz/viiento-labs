/** Maps a Template's icon key to its lucide-react glyph — the one place
 *  that resolves it, so templates.types stays framework-agnostic. Also
 *  home of TemplateIconBadge: icon + accent color as ONE unit, so every
 *  surface renders the same recognition handle. */
import { FileText, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import { cn } from '@acme/ui';
import { COLOR_CLASSES } from './templates.colors';
import type { TemplateColor } from './templates.colors';
import type { TemplateIcon } from '../templates.types';

const ICONS: Record<TemplateIcon, typeof FileText> = {
  'file-text': FileText,
  stethoscope: Stethoscope,
  'shield-check': ShieldCheck,
  sparkles: Sparkles,
};

export const TemplateIconGlyph = ({
  icon,
  className = 'size-4',
}: {
  readonly icon: TemplateIcon;
  readonly className?: string;
}) => {
  const Icon = ICONS[icon];
  return <Icon className={className} />;
};

/** The template's face, everywhere: tinted chip + glyph. Rounded-full is
 *  the timeline idiom (the dot on the rail); square surfaces pass
 *  `rounded="md"`. */
export const TemplateIconBadge = ({
  icon,
  color,
  rounded = 'full',
  className = 'size-8',
  glyphClassName,
}: {
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  readonly rounded?: 'full' | 'md';
  readonly className?: string;
  readonly glyphClassName?: string | undefined;
}) => (
  <div
    className={cn(
      'flex shrink-0 items-center justify-center',
      rounded === 'full' ? 'rounded-full' : 'rounded-md',
      COLOR_CLASSES[color].chip,
      className,
    )}
  >
    <TemplateIconGlyph icon={icon} className={glyphClassName ?? 'size-4'} />
  </div>
);
