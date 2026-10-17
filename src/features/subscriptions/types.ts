import type { LocalDate } from '@/utils/dates';

export type BillingCycle = 'week' | 'month' | 'year';

export type Subscription = {
  id: string;
  /** Catalog id, or null for one the person typed in themselves. */
  serviceId: string | null;
  name: string;
  /** Price per cycle in cents. Kept as an integer so sums never drift. */
  priceCents: number;
  /** ISO 4217 code. Only USD until the currency setting lands. */
  currency: 'USD';
  cycle: BillingCycle;
  /**
   * The next charge as entered. For a trial this is the day the trial ends and the
   * first charge lands. Use nextChargeDate() to read it, which rolls past dates forward.
   */
  chargeOn: LocalDate;
  trial: boolean;
  createdAt: string;
};

/** What the Add screen hands to the store; the store fills in id and createdAt. */
export type NewSubscription = Omit<Subscription, 'id' | 'createdAt' | 'currency'>;

/**
 * A subscription the person cancelled through lapse., kept for the money-saved total.
 * `chargeOn` is the next charge it would have made, so savings count from there.
 */
export type CancelledSubscription = Omit<Subscription, 'createdAt'> & { cancelledOn: LocalDate };
