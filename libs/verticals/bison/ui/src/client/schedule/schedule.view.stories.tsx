import type { Meta, StoryObj } from '@storybook/react';
import { ScheduleView } from './schedule.view';
import { ClientShell } from '../client.shell';
import type { ReorderMode, ScheduleVM } from './schedule.types';
import {
  blockedVM,
  bufferedVM,
  errorVM,
  freeDayVM,
  loadingVM,
  readOnlyVM,
  todayVM,
  tomorrowVM,
} from './schedule.fixtures';

const meta: Meta<typeof ScheduleView> = {
  title: 'Bison Manager/Client/Schedule',
  component: ScheduleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof ScheduleView>;

const noop = () => undefined;

const inShell = (vm: ScheduleVM, initialReorder: 'off' | ReorderMode = 'off') =>
  function Render() {
    return (
      <ClientShell active="Agenda">
        <ScheduleView
          vm={vm}
          initialReorder={initialReorder}
          onSelectDay={noop}
          onCreateAppointment={noop}
          onCancelAppointment={noop}
          onBlockTime={noop}
          onRemoveBlock={noop}
          onBufferChange={noop}
          onApply={noop}
          onRetry={noop}
        />
      </ClientShell>
    );
  };

/** The day as a timeline — the main agenda view. Click a block for its
 *  actions; "Reorder" enables dragging. */
export const Default: Story = { render: inShell(todayVM) };

/** Reorder active in free mode: blocks are draggable/resizable; overlaps are
 *  allowed and render side by side. Edits collect into Apply/Discard. */
export const Reordering: Story = { render: inShell(todayVM, 'free') };

/** Blocked time (Calendly-style): a one-off lunch block and a recurring
 *  daily reservation — striped walls with a lock; click one to remove it.
 *  Every rule set collides with them. */
export const WithBlocks: Story = { render: inShell(blockedVM) };

/** A 30-min required gap between appointments (travel/cleanup policy): the
 *  striped zone after each appointment is reserved; Strict and the cascades
 *  respect it. Free ignores it. */
export const WithBuffer: Story = { render: inShell(bufferedVM, 'strict') };

/** A sparse afternoon. */
export const SparseDay: Story = { render: inShell(tomorrowVM) };

/** Nothing booked — the grid itself shows the whole day free. */
export const FreeDay: Story = { render: inShell(freeDayVM) };

/** Skeleton while the day loads. */
export const Loading: Story = { render: inShell(loadingVM) };

/** The agenda service failed — inline error with a retry. */
export const LoadError: Story = { render: inShell(errorVM) };

/** No scheduling capability: no CTA, no reorder controls, no block menus. */
export const ReadOnly: Story = { render: inShell(readOnlyVM) };
