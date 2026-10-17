import { toLocalDate, type LocalDate } from '@/utils/dates';

import { nextChargeDate, yearlyCents } from './billing';
import type { Subscription } from './types';

/** The first day of the month holding `today`. */
function monthStart(today: LocalDate): LocalDate {
  return `${today.slice(0, 8)}01`;
}

/** The day it was added to lapse. */
export function addedOn(sub: Subscription): LocalDate {
  return toLocalDate(new Date(sub.createdAt));
}

/** Running free trials have their own reminder and screen, so the check-in leaves them out. */
function inCheckIn(sub: Subscription, today: LocalDate): boolean {
  return !(sub.trial && nextChargeDate(sub, today) === sub.chargeOn);
}

/** Not kept at a check-in this month, and added before this month started. */
export function isDue(sub: Subscription, today: LocalDate): boolean {
  return inCheckIn(sub, today) && (sub.reviewedOn ?? addedOn(sub)) < monthStart(today);
}

export function dueCount(subscriptions: Subscription[], today: LocalDate): number {
  return subscriptions.filter((s) => isDue(s, today)).length;
}

/**
 * What a check-in goes through: the ones due this month or, once those are done, everything it
 * covers. Longest since a review first, then the most expensive.
 */
export function checkInQueue(subscriptions: Subscription[], today: LocalDate): Subscription[] {
  const covered = subscriptions.filter((s) => inCheckIn(s, today));
  const due = covered.filter((s) => isDue(s, today));
  return (due.length ? due : covered).sort(
    (a, b) =>
      (a.reviewedOn ?? '').localeCompare(b.reviewedOn ?? '') ||
      yearlyCents(b.priceCents, b.cycle) - yearlyCents(a.priceCents, a.cycle) ||
      a.name.localeCompare(b.name),
  );
}
