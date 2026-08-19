/**
 * Toggle chips for the Format editor — which account tokens make up the
 * letterhead/footer, and which marks are on. Picking WHICH is the whole
 * grant: where each lands is fixed (MARK_DEFAULTS, band order), so a
 * format cannot be laid out badly.
 */
import { Button } from '@acme/ui';
import { DOCUMENT_TOKENS, TOKEN_LABEL } from '../document.tokens';
import type { DocumentToken } from '../document.tokens';
import type { MarkVM } from '../document.types';

const Chip = ({
  label,
  active,
  onClick,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}) => (
  <Button
    type="button"
    size="sm"
    variant={active ? 'default' : 'outline'}
    className="h-7 px-2.5 text-xs"
    onClick={onClick}
  >
    {label}
  </Button>
);

const Legend = ({ text }: { readonly text: string }) => (
  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    {text}
  </p>
);

export const TokenChips = ({
  legend,
  active,
  onToggle,
}: {
  readonly legend: string;
  readonly active: readonly DocumentToken[];
  readonly onToggle: (token: DocumentToken) => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <Legend text={legend} />
    <div className="flex flex-wrap gap-1.5">
      {DOCUMENT_TOKENS.map((token) => (
        <Chip
          key={token}
          label={TOKEN_LABEL[token]}
          active={active.includes(token)}
          onClick={() => onToggle(token)}
        />
      ))}
    </div>
  </div>
);

const MARK_ASSETS: readonly MarkVM['asset'][] = [
  'logo',
  'qr',
  'seal',
  'signature',
];

const MARK_LABEL: Record<MarkVM['asset'], string> = {
  logo: 'Logo',
  qr: 'QR',
  seal: 'Seal',
  signature: 'Signature',
};

export const MarkChips = ({
  marks,
  onToggle,
}: {
  readonly marks: readonly MarkVM[];
  readonly onToggle: (asset: MarkVM['asset']) => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <Legend text="Marks" />
    <div className="flex flex-wrap gap-1.5">
      {MARK_ASSETS.map((asset) => (
        <Chip
          key={asset}
          label={MARK_LABEL[asset]}
          active={marks.some((m) => m.asset === asset)}
          onClick={() => onToggle(asset)}
        />
      ))}
    </div>
  </div>
);
