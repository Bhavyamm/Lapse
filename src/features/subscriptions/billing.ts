import { addDays, addMonths, type LocalDate } from '@/utils/dates';

import type { BillingCycle, Subscription } from './types';

/** The date `count` cycles after `from`, always computed from the anchor so months don't drift. */
export function addCycles(from: LocalDate, cycle: BillingCycle, count: number): LocalDate {
  switch (cycle) {
    case 'week':
      return addDays(from, 7 * count);
    case 'month':
      return addMonths(from, count);
    case 'year':
      return addMonths(from, 12 * count);
  }
}

/** The next charge on or after `today`. A date the person entered that has passed rolls forward by whole cycles. */
export function nextChargeDate(sub: Pick<Subscription, 'chargeOn' | 'cycle'>, today: LocalDate): LocalDate {
  if (sub.chargeOn >= today) return sub.chargeOn;
  let count = 1;
  let next = addCycles(sub.chargeOn, sub.cycle, count);
  while (next < today) next = addCycles(sub.chargeOn, sub.cycle, ++count);
  return next;
}

/** The price spread over a month, in cents. A year is 12 months; a week is 52/12 of a month. */
export function monthlyCents(priceCents: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'week':
      return Math.round((priceCents * 52) / 12);
    case 'month':
      return priceCents;
    case 'year':
      return Math.round(priceCents / 12);
  }
}

/** "$11.99". */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString('en-US');
  return `${sign}$${dollars}.${String(abs % 100).padStart(2, '0')}`;
}

const CYCLE_WORD: Record<BillingCycle, string> = { week: 'a week', month: 'a month', year: 'a year' };

/** "$11.99 a month", or "From $7.99 a month" for a catalog price that depends on the plan. */
export function describePrice(priceCents: number, cycle: BillingCycle, from = false): string {
  return `${from ? 'From ' : ''}${formatMoney(priceCents)} ${CYCLE_WORD[cycle]}`;
}

/** Anything above this is a typo, not a subscription. */
export const MAX_PRICE_CENTS = 9_999_999;

/**
 * Parses what someone typed in a price field ("11.99", "$11", "11,99") into cents.
 * Returns null for anything that isn't a positive amount.
 */
export function parsePrice(text: string): number | null {
  const cleaned = text.replace(/[$\s]/g, '').replace(',', '.');
  if (!/^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  return cents > 0 && cents <= MAX_PRICE_CENTS ? cents : null;
}
