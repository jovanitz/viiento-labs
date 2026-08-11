import type { Meta, StoryObj } from '@storybook/react';
import { AgendaView } from './agenda.view';
import { ClientShell } from '../client.shell';
import type { AgendaVM } from './agenda.types';
import {
  errorVM,
  freeDayVM,
  loadingVM,
  readOnlyVM,
  todayVM,
  tomorrowVM,
} from './agenda.fixtures';

const meta: Meta<typeof AgendaView> = {
  title: 'Bison Manager/Client/Agenda',
  component: AgendaView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof AgendaView>;

const noop = () => undefined;

const inShell = (vm: AgendaVM) =>
  function Render() {
    return (
      <ClientShell active="Agenda">
        <AgendaView
          vm={vm}
          onPrevDay={noop}
          onNextDay={noop}
          onToday={noop}
          onNewAppointment={noop}
          onOpenAppointment={noop}
          onReschedule={noop}
          onCancelAppointment={noop}
          onRetry={noop}
        />
      </ClientShell>
    );
  };

/** A busy day. Confirmed is the norm and shows no badge; the two canceled
 *  appointments get the pill + strikethrough and lose their action menu. */
export const Default: Story = { render: inShell(todayVM) };

/** Skeleton rows while the day loads. */
export const Loading: Story = { render: inShell(loadingVM) };

/** A day with nothing booked — guidance plus the schedule CTA. */
export const FreeDay: Story = { render: inShell(freeDayVM) };

/** The agenda service failed — inline error with a retry. */
export const LoadError: Story = { render: inShell(errorVM) };

/** No scheduling capability: no CTA, no row menus; the day is view-only. */
export const ReadOnly: Story = { render: inShell(readOnlyVM) };

/** The one-or-two-items case — a sparse afternoon, not a wall of rows. */
export const SparseDay: Story = { render: inShell(tomorrowVM) };
