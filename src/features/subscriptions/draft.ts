import type { CatalogService } from '@/features/catalog/catalog';
import { addDays, type LocalDate } from '@/utils/dates';

import { addCycles, describePrice, nextChargeDate, parsePrice } from './billing';
import type { BillingCycle, NewSubscription, Subscription } from './types';

/** A subscription being set up on the Add screen, before it is saved. */
export type Draft = {
  /** Stable key for the list; the catalog id, or a generated one for custom entries. */
  key: string;
  serviceId: string | null;
  name: string;
  /** What is in the price field, kept as text so half-typed values survive. */
  priceText: string;
  cycle: BillingCycle;
  trial: boolean;
  chargeOn: LocalDate;
  /** True while the price is still the catalog's "from" price. */
  from: boolean;
  /** The date was chosen already, so changing the cycle leaves it alone. Set for saved subscriptions. */
  dateChosen?: boolean;
};

export function draftFromService(service: CatalogService, today: LocalDate): Draft {
  const trial = !!service.trialDays;
  return {
    key: service.id,
    serviceId: service.id,
    name: service.name,
    priceText: (service.price / 100).toFixed(2),
    cycle: service.cycle,
    trial,
    chargeOn: trial ? addDays(today, service.trialDays!) : addCycles(today, service.cycle, 1),
    from: !!service.from,
  };
}

/** A saved subscription opened in the editor, with its next charge as the date to change. */
export function draftFromSubscription(sub: Subscription, today: LocalDate): Draft {
  const next = nextChargeDate(sub, today);
  return {
    key: sub.id,
    serviceId: sub.serviceId,
    name: sub.name,
    priceText: (sub.priceCents / 100).toFixed(2),
    cycle: sub.cycle,
    // A trial whose end date has passed is a normal renewal now.
    trial: sub.trial && next === sub.chargeOn,
    chargeOn: next,
    from: false,
    dateChosen: true,
  };
}

let customCount = 0;
export function blankDraft(name: string, today: LocalDate): Draft {
  customCount += 1;
  return {
    key: `custom-${customCount}`,
    serviceId: null,
    name,
    priceText: '',
    cycle: 'month',
    trial: false,
    chargeOn: addCycles(today, 'month', 1),
    from: false,
  };
}

/** Why the draft can't be saved yet, in words for the person, or null when it's fine. */
export function draftProblem(draft: Draft): string | null {
  if (!draft.name.trim()) return 'Add a name.';
  if (parsePrice(draft.priceText) === null) return 'Add a price, like 9.99.';
  return null;
}

/** "$11.99 a month", or "Free trial, then $29.99 a month". */
export function describeDraft(draft: Draft): string {
  const cents = parsePrice(draft.priceText);
  if (cents === null) return 'Add a price';
  const price = describePrice(cents, draft.cycle);
  return draft.trial ? `Free trial, then ${price}` : price;
}

export function toNewSubscription(draft: Draft): NewSubscription {
  const priceCents = parsePrice(draft.priceText);
  if (priceCents === null) throw new Error(`Draft ${draft.key} has no valid price`);
  return {
    serviceId: draft.serviceId,
    name: draft.name.trim(),
    priceCents,
    cycle: draft.cycle,
    chargeOn: draft.chargeOn,
    trial: draft.trial,
  };
}
