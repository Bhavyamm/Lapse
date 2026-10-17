import type { ReminderLead } from '@/features/reminders/lead-time';
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
  /** The renewal alert for this one. Missing means on, so older saves keep their alerts. */
  remind?: boolean;
  /** How early this one's reminder comes. Missing means the setting on Profile. */
  lead?: ReminderLead;
  /** Set from the trial reminder's "I'll keep it": no more reminders about this trial ending. */
  trialKept?: boolean;
  /** "Remind me tonight" from a trial reminder: when the extra reminder fires, in ms since 1970. */
  snoozeUntil?: number;
  createdAt: string;
};

/** What the Add screen hands to the store; the store fills in id and createdAt. */
export type NewSubscription = Omit<Subscription, 'id' | 'createdAt' | 'currency'>;

/** What can change on a saved subscription. */
export type SubscriptionChanges = Partial<NewSubscription>;

/**
 * A subscription the person cancelled through lapse., kept for the money-saved total.
 * `chargeOn` stays the original anchor so later dates don't drift; `savedFrom` is the first
 * charge that won't happen, and `trial` is true only for a trial cancelled before it converted.
 */
export type CancelledSubscription = Omit<Subscription, 'createdAt'> & { cancelledOn: LocalDate; savedFrom: LocalDate };
