import { daysBetween, formatShortDate, fromLocalDate, type LocalDate } from '@/utils/dates';

import { monthlyCents, nextChargeDate, yearlyCents } from './billing';
import type { Subscription } from './types';

/** How far ahead a trial ending counts as needing attention. */
export const ATTENTION_DAYS = 7;
/** Rows in Home's Coming up card before "See all". */
export const UPCOMING_LIMIT = 4;

export type Upcoming = { sub: Subscription; next: LocalDate; trialEnding: boolean };
export type TrialAlert = { sub: Subscription; endsOn: LocalDate; daysLeft: number };

export type Overview = {
  /** Totals and count of what is being paid for; running free trials cost nothing yet. */
  monthlyCents: number;
  yearlyCents: number;
  count: number;
  /** Everything tracked, trials included. */
  tracked: number;
  /** Trials ending soon, soonest first. */
  attention: TrialAlert[];
  /** The next charges not already shown under attention, soonest first. */
  upcoming: Upcoming[];
  /** All subscriptions by next charge, for "See all". */
  all: Upcoming[];
};

export function buildOverview(subscriptions: Subscription[], today: LocalDate): Overview {
  const all = subscriptions
    .map((sub) => {
      const next = nextChargeDate(sub, today);
      // A trial ends on the first charge; once that date passes it's a normal renewal.
      return { sub, next, trialEnding: sub.trial && next === sub.chargeOn };
    })
    .sort((a, b) => a.next.localeCompare(b.next) || a.sub.name.localeCompare(b.sub.name));

  const attention = all
    .filter((u) => u.trialEnding && daysBetween(today, u.next) <= ATTENTION_DAYS)
    .map((u) => ({ sub: u.sub, endsOn: u.next, daysLeft: daysBetween(today, u.next) }));
  const flagged = new Set(attention.map((a) => a.sub.id));

  const paying = all.filter((u) => !u.trialEnding).map((u) => u.sub);
  return {
    monthlyCents: paying.reduce((sum, s) => sum + monthlyCents(s.priceCents, s.cycle), 0),
    yearlyCents: paying.reduce((sum, s) => sum + yearlyCents(s.priceCents, s.cycle), 0),
    count: paying.length,
    tracked: subscriptions.length,
    attention,
    upcoming: all.filter((u) => !flagged.has(u.sub.id)).slice(0, UPCOMING_LIMIT),
    all,
  };
}

/** "today", "tomorrow" or "in 3 days". */
export function inDays(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

/** "today", "tomorrow", the weekday ("Sat") within a week, else the date ("Sat, Oct 24"). */
export function whenShort(date: LocalDate, today: LocalDate): string {
  const days = daysBetween(today, date);
  if (days <= 1) return inDays(days);
  if (days < 7) return fromLocalDate(date).toLocaleDateString(undefined, { weekday: 'short' });
  return formatShortDate(date);
}

export type SortKey = 'next' | 'price' | 'name';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'next', label: 'Next renewal' },
  { value: 'price', label: 'Price' },
  { value: 'name', label: 'Name' },
];

/**
 * Splits the full list for All subscriptions: running free trials first (soonest ending),
 * then everything else in the chosen order. Price sorts by cost per month, highest first.
 */
export function sortForList(all: Upcoming[], by: SortKey): { trials: Upcoming[]; rest: Upcoming[] } {
  const byName = (a: Upcoming, b: Upcoming) => a.sub.name.localeCompare(b.sub.name);
  const compare: Record<SortKey, (a: Upcoming, b: Upcoming) => number> = {
    next: (a, b) => a.next.localeCompare(b.next) || byName(a, b),
    price: (a, b) =>
      monthlyCents(b.sub.priceCents, b.sub.cycle) - monthlyCents(a.sub.priceCents, a.sub.cycle) || byName(a, b),
    name: byName,
  };
  return {
    trials: all.filter((u) => u.trialEnding).sort(compare.next),
    rest: all.filter((u) => !u.trialEnding).sort(compare[by]),
  };
}
