/**
 * The Builder's working area — palette + canvas, with the as-on-the-
 * timeline preview beside them. From xl up both always show (the preview
 * rides along, sticky); below that the header's Preview/Edit toggle picks
 * one, because there is no room for both.
 */
import { cn } from '@acme/ui';
import { BuilderPalette } from './palette/templates.builder.palette';
import { BuilderCanvas } from './canvas/templates.builder.canvas';
import { BuilderTimelinePreview } from './templates.builder.preview';
import type {
  FieldKind,
  TemplateBlock,
  TemplateColor,
  TemplateIcon,
} from '../templates.types';

/** Editor and preview, side by side from xl up; below that the header's
 *  toggle decides which one shows. */
export const BuilderBody = ({
  name,
  icon,
  color,
  blocks,
  previewing,
  onInsertKind,
  onReorder,
  onChangeBlock,
  onRemoveBlock,
}: {
  readonly name: string;
  readonly icon: TemplateIcon;
  readonly color: TemplateColor;
  readonly blocks: readonly TemplateBlock[];
  readonly previewing: boolean;
  readonly onInsertKind: (kind: FieldKind, atIndex: number) => void;
  readonly onReorder: (fromIndex: number, toIndex: number) => void;
  readonly onChangeBlock: (id: string, patch: Partial<TemplateBlock>) => void;
  readonly onRemoveBlock: (id: string) => void;
}) => (
  <div className="flex flex-col gap-6 xl:flex-row">
    {/* Below xl the toggle swaps editor and preview; from xl up the editor
        always shows and the preview rides along on the right. */}
    <div
      className={cn(
        'min-w-0 flex-1 flex-col gap-6 lg:flex-row',
        previewing ? 'hidden xl:flex' : 'flex',
      )}
    >
      <BuilderPalette
        onAddBlock={(kind) => onInsertKind(kind, blocks.length)}
      />
      <BuilderCanvas
        blocks={blocks}
        onInsertKind={(kind, atIndex) =>
          onInsertKind(kind as FieldKind, atIndex)
        }
        onReorder={onReorder}
        onChangeBlock={onChangeBlock}
        onRemoveBlock={onRemoveBlock}
      />
    </div>
    <aside
      className={cn(
        'w-full xl:block xl:w-96 xl:shrink-0',
        previewing ? 'block max-w-xl' : 'hidden',
      )}
    >
      <div className="xl:sticky xl:top-4">
        <BuilderTimelinePreview
          name={name}
          icon={icon}
          color={color}
          blocks={blocks}
        />
      </div>
    </aside>
  </div>
);
