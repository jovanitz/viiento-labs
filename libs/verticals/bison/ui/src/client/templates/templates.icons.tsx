/** Maps a Template's icon key to its lucide-react glyph — the one place
 *  that resolves it, so templates.types stays framework-agnostic. */
import { FileText, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import type { TemplateIcon } from './templates.types';

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
