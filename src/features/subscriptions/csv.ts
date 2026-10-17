import type { LocalDate } from '@/utils/dates';

import { monthlyCents, nextChargeDate } from './billing';
import type { Subscription } from './types';

const HEADER = ['Name', 'Price', 'Currency', 'Billing cycle', 'Next charge', 'Free trial', 'Cost per month'];
const CYCLE: Record<Subscription['cycle'], string> = { week: 'Weekly', month: 'Monthly', year: 'Yearly' };

const amount = (cents: number) => (cents / 100).toFixed(2);

/**
 * One CSV cell. Quotes anything with a comma, quote or line break, and puts a ' before text
 * a spreadsheet would run as a formula (a custom name like "=HYPERLINK(...)").
 */
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Everything tracked as a CSV a spreadsheet opens, soonest charge first. Starts with a BOM so Excel reads UTF-8. */
export function toCsv(subscriptions: Subscription[], today: LocalDate): string {
  const rows = subscriptions
    .map((sub) => ({ sub, next: nextChargeDate(sub, today) }))
    .sort((a, b) => a.next.localeCompare(b.next) || a.sub.name.localeCompare(b.sub.name))
    .map(({ sub, next }) => [
      sub.name,
      amount(sub.priceCents),
      sub.currency,
      CYCLE[sub.cycle],
      next,
      sub.trial && next === sub.chargeOn ? 'Yes' : 'No',
      amount(monthlyCents(sub.priceCents, sub.cycle)),
    ]);
  return '\uFEFF' + [HEADER, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
