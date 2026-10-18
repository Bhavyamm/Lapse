import { toLocalDate, type LocalDate } from '@/utils/dates';

import { addCycles } from './billing';
import type { Subscription } from './types';

/** How many months ahead the calendar goes, not counting this one. */
export const MONTHS_AHEAD = 11;
/** Rows in the list under the calendar. */
export const MONTH_LIST_LIMIT = 4;

export type Charge = { sub: Subscription; on: LocalDate; trialEnding: boolean };

export type MonthPlan = {
  year: number;
  /** 0-based, like Date. */
  month: number;
  /** The month holding `today`: only charges from today on count, the rest have happened. */
  current: boolean;
  /** Soonest first; same-day charges by name. */
  charges: Charge[];
  /** Charges keyed by day. */
  byDay: Map<LocalDate, Charge[]>;
  /** Everything still to pay in the month, trial conversions included. */
  dueCents: number;
};

/**
 * Every charge from `from` to `to`, both included. A trial is counted at its full price on the
 * day it ends, because that's the charge to watch for; after that it renews like the rest.
 */
export function chargesBetween(subscriptions: Subscription[], from: LocalDate, to: LocalDate): Charge[] {
  const charges: Charge[] = [];
  for (const sub of subscriptions) {
    // Count cycles from the anchor so a month-end date doesn't drift (Jan 31, Feb 28, Mar 31).
    for (let count = 0, on = sub.chargeOn; on <= to; on = addCycles(sub.chargeOn, sub.cycle, ++count)) {
      if (on >= from) charges.push({ sub, on, trialEnding: sub.trial && count === 0 });
    }
  }
  return charges.sort((a, b) => a.on.localeCompare(b.on) || a.sub.name.localeCompare(b.sub.name));
}

/** The charges in one month. In the current month that means today to the month's end. */
export function planMonth(subscriptions: Subscription[], year: number, month: number, today: LocalDate): MonthPlan {
  const first = toLocalDate(new Date(year, month, 1));
  const last = toLocalDate(new Date(year, month + 1, 0));
  const current = today >= first && today <= last;
  const charges = chargesBetween(subscriptions, current ? today : first, last);
  const byDay = new Map<LocalDate, Charge[]>();
  for (const charge of charges) byDay.set(charge.on, [...(byDay.get(charge.on) ?? []), charge]);
  return {
    year,
    month,
    current,
    charges,
    byDay,
    dueCents: charges.reduce((sum, c) => sum + c.sub.priceCents, 0),
  };
}

/** The month `offset` months after the one holding `today`. */
export function shiftMonth(today: LocalDate, offset: number): { year: number; month: number } {
  const [y, m] = today.split('-').map(Number);
  const date = new Date(y, m - 1 + offset, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}
