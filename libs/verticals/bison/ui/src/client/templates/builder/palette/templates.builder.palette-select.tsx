/**
 * Mobile stand-in for the palette — a compact Select instead of the
 * draggable chip grid (there's no room to browse 13 chips on a phone
 * before even reaching the canvas). Picking an item adds it immediately,
 * then the trigger resets to its placeholder so the next pick reads as
 * "add another", not "the block you have selected".
 */
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@acme/ui';
import { BLOCK_CATALOG, BLOCK_GROUPS } from './templates.block-catalog';
import type { FieldKind } from '../../templates.types';

export const BuilderPaletteSelect = ({
  onAddBlock,
}: {
  readonly onAddBlock: (kind: FieldKind) => void;
}) => {
  const [value, setValue] = useState('');
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        onAddBlock(v as FieldKind);
        setValue('');
      }}
    >
      <SelectTrigger aria-label="Add a block">
        <SelectValue placeholder="Add a block…" />
      </SelectTrigger>
      <SelectContent>
        {BLOCK_GROUPS.map((group) => (
          <SelectGroup key={group}>
            <SelectLabel>{group}</SelectLabel>
            {BLOCK_CATALOG.filter((entry) => entry.group === group).map(
              (entry) => (
                <SelectItem key={entry.kind} value={entry.kind}>
                  {entry.label}
                </SelectItem>
              ),
            )}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};
