/**
 * The Builder's palette — every block kind, grouped, draggable onto the
 * canvas. A click appends it to the end too, so building a form never
 * strictly requires a successful drag.
 */
import { BLOCK_CATALOG, BLOCK_GROUPS } from './templates.block-catalog';
import { PALETTE_DRAG_MIME } from '../templates.builder.logic';
import { BlockKindGlyph } from './templates.block-icons';
import { BuilderPaletteSelect } from './templates.builder.palette-select';
import type { FieldKind } from '../../templates.types';

const Chip = ({
  kind,
  label,
  description,
  onAdd,
}: {
  readonly kind: FieldKind;
  readonly label: string;
  readonly description: string;
  readonly onAdd: () => void;
}) => (
  <button
    type="button"
    draggable
    onDragStart={(e) => {
      e.dataTransfer.setData(PALETTE_DRAG_MIME, kind);
      e.dataTransfer.effectAllowed = 'copy';
    }}
    onClick={onAdd}
    className="flex w-full cursor-grab items-start gap-2 rounded-md border border-border p-2 text-left transition-colors hover:border-primary hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
  >
    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
      <BlockKindGlyph kind={kind} className="size-3.5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="truncate text-[11px] text-muted-foreground">
        {description}
      </p>
    </div>
  </button>
);

export const BuilderPalette = ({
  onAddBlock,
}: {
  readonly onAddBlock: (kind: FieldKind) => void;
}) => (
  <div className="w-full lg:w-56 lg:shrink-0">
    {/* Mobile: a compact Select — there's no room to browse 13 chips on a
        phone before even reaching the canvas. Desktop (lg:): the full
        chip grid, browsable and draggable. */}
    <div className="lg:hidden">
      <BuilderPaletteSelect onAddBlock={onAddBlock} />
    </div>
    <div className="hidden flex-col gap-4 lg:flex">
      {BLOCK_GROUPS.map((group) => (
        <div key={group} className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group}
          </p>
          <div className="flex flex-col gap-1.5">
            {BLOCK_CATALOG.filter((entry) => entry.group === group).map(
              (entry) => (
                <Chip
                  key={entry.kind}
                  kind={entry.kind}
                  label={entry.label}
                  description={entry.description}
                  onAdd={() => onAddBlock(entry.kind)}
                />
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);
