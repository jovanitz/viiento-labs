/** Pure day-grouping for the Timeline — newest day first, newest entry
 *  within a day first. Data only, no framework. */
import type {
  EntryTemplate,
  TimelineDay,
  TimelineEntry,
  TimelineVM,
} from './timeline.types';

const dateKey = (at: Date) => at.toDateString();

const dayLabel = (at: Date) =>
  at.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

export const deriveTimelineVM = (
  entries: readonly TimelineEntry[],
  templates: readonly EntryTemplate[],
): TimelineVM => {
  const sorted = [...entries].sort((a, b) => b.at.getTime() - a.at.getTime());
  const order: string[] = [];
  const byDay = new Map<string, TimelineEntry[]>();
  for (const entry of sorted) {
    const key = dateKey(entry.at);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(entry);
    else {
      byDay.set(key, [entry]);
      order.push(key);
    }
  }
  const days: readonly TimelineDay[] = order.map((key) => ({
    dateLabel: dayLabel(byDay.get(key)![0]!.at),
    entries: byDay.get(key)!,
  }));
  return { days, templates, empty: entries.length === 0 };
};
