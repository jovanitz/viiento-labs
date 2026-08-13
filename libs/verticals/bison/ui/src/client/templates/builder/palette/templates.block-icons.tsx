/** Maps a block Kind to its lucide-react glyph — the one place that
 *  resolves it, so templates.types stays framework-agnostic. */
import {
  AlignLeft,
  Calendar,
  CircleDot,
  Clock,
  Hash,
  Heading,
  Info,
  List,
  ListChecks,
  Paperclip,
  PenTool,
  ToggleLeft,
  Type,
} from 'lucide-react';
import type { FieldKind } from '../../templates.types';

const ICONS: Record<FieldKind, typeof Type> = {
  'short-text': Type,
  'long-text': AlignLeft,
  number: Hash,
  radio: CircleDot,
  select: List,
  checkboxes: ListChecks,
  switch: ToggleLeft,
  date: Calendar,
  time: Clock,
  file: Paperclip,
  signature: PenTool,
  section: Heading,
  'help-text': Info,
};

export const BlockKindGlyph = ({
  kind,
  className = 'size-4',
}: {
  readonly kind: FieldKind;
  readonly className?: string;
}) => {
  const Icon = ICONS[kind];
  return <Icon className={className} />;
};
