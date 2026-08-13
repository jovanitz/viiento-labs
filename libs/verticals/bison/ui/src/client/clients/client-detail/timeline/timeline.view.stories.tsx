import type { Meta, StoryObj } from '@storybook/react';
import { TimelineView } from './timeline.view';
import { deriveTimelineVM } from './timeline.logic';
import { SEED_ENTRIES } from './timeline.fixtures';
import { TEMPLATES } from '../../../templates/templates.fixtures';

const meta: Meta<typeof TimelineView> = {
  title: 'Bison Manager/Client/Client Detail/Timeline',
  component: TimelineView,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof TimelineView>;

/** Seed entries across two days — grouping and the connector line. */
export const Default: Story = {
  args: {
    vm: deriveTimelineVM(SEED_ENTRIES, TEMPLATES),
    expandedIds: new Set(),
    onAddClick: () => undefined,
    onToggleEntry: () => undefined,
    onSaveEntryFields: () => undefined,
  },
};

/** Clicking an entry expands its fields inline — no modal/sheet. */
export const EntryExpanded: Story = {
  args: {
    vm: deriveTimelineVM(SEED_ENTRIES, TEMPLATES),
    expandedIds: new Set([SEED_ENTRIES[1]!.id]),
    onAddClick: () => undefined,
    onToggleEntry: () => undefined,
    onSaveEntryFields: () => undefined,
  },
};

/** No entries logged yet. */
export const Empty: Story = {
  args: {
    vm: deriveTimelineVM([], TEMPLATES),
    expandedIds: new Set(),
    onAddClick: () => undefined,
    onToggleEntry: () => undefined,
    onSaveEntryFields: () => undefined,
  },
};
