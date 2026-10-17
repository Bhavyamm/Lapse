import type { LocalDate } from '@/utils/dates';

import { nextChargeDate } from './billing';
import { chargesBetween } from './calendar';
import type { CancelledSubscription, Subscription } from './types';

export type Savings = {
  /** Every charge a cancelled subscription would have made up to today. */
  savedCents: number;
  /** Paid subscriptions cancelled. */
  cancelled: number;
  /** Free trials cancelled before their first charge. */
  trialsCaught: number;
};

/** The record kept when a subscription is cancelled on `today`. */
export function toCancelled(sub: Subscription, today: LocalDate): CancelledSubscription {
  const { createdAt: _createdAt, ...rest } = sub;
  const next = nextChargeDate(sub, today);
  // Still a trial only if it hasn't converted yet; that's a trial caught.
  return { ...rest, chargeOn: next, trial: sub.trial && next === sub.chargeOn, cancelledOn: today };
}

export function summarizeSavings(cancelled: CancelledSubscription[], today: LocalDate): Savings {
  const caught = (c: CancelledSubscription) => c.trial;
  // Counting from the next charge after cancelling: the one that was already paid isn't a saving.
  const savedCents = chargesBetween(
    cancelled.map((c) => ({ ...c, createdAt: c.cancelledOn })),
    '0000-01-01',
    today,
  ).reduce((sum, charge) => sum + charge.sub.priceCents, 0);
  return {
    savedCents,
    cancelled: cancelled.filter((c) => !caught(c)).length,
    trialsCaught: cancelled.filter(caught).length,
  };
}
