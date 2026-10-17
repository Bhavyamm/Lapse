import { addDays, type LocalDate } from '@/utils/dates';

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
  // A running trial is caught: its first charge is saved, even if it was due today.
  const trial = sub.trial && sub.chargeOn >= today;
  // Otherwise a charge due today has most likely gone out already, so savings start after it.
  const savedFrom = trial ? sub.chargeOn : nextChargeDate(sub, addDays(today, 1));
  return { ...rest, trial, cancelledOn: today, savedFrom };
}

export function summarizeSavings(cancelled: CancelledSubscription[], today: LocalDate): Savings {
  const savedCents = cancelled
    .flatMap((c) => chargesBetween([{ ...c, createdAt: c.cancelledOn }], c.savedFrom, today))
    .reduce((sum, charge) => sum + charge.sub.priceCents, 0);
  return {
    savedCents,
    cancelled: cancelled.filter((c) => !c.trial).length,
    trialsCaught: cancelled.filter((c) => c.trial).length,
  };
}
