import { daysBetween, formatShortDate, fromLocalDate, type LocalDate } from '@/utils/dates';

import { monthlyCents, nextChargeDate } from './billing';
import type { BillingCycle, Subscription } from './types';

/** How far ahead a trial ending counts as needing attention. */
export const ATTENTION_DAYS = 7;
/** Rows in Home's Coming up card before "See all". */
export const UPCOMING_LIMIT = 4;

export type Upcoming = { sub: Subscription; next: LocalDate; trialEnding: boolean };
export type TrialAlert = { sub: Subscription; endsOn: LocalDate; daysLeft: number };

export type Overview = {
  monthlyCents: number;
  yearlyCents: number;
  count: number;
  /** Trials ending soon, soonest first. */
  attention: TrialAlert[];
  /** The next charges not already shown under attention, soonest first. */
  upcoming: Upcoming[];
  /** All subscriptions by next charge, for "See all". */
  all: Upcoming[];
};

const PER_YEAR: Record<BillingCycle, number> = { week: 52, month: 12, year: 1 };

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

  return {
    monthlyCents: subscriptions.reduce((sum, s) => sum + monthlyCents(s.priceCents, s.cycle), 0),
    yearlyCents: subscriptions.reduce((sum, s) => sum + s.priceCents * PER_YEAR[s.cycle], 0),
    count: subscriptions.length,
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
