/**
 * Calendar dates are stored as local "YYYY-MM-DD" strings. A renewal happens on a day,
 * not at an instant, so this keeps it on the same day when the phone changes time zone.
 */
export type LocalDate = string;

/** "Thursday, Oct 16" in the device locale. */
export function formatToday(date: Date = new Date()): string {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${weekday}, ${monthDay}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function toLocalDate(date: Date): LocalDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight of the given day. */
export function fromLocalDate(value: LocalDate): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): LocalDate {
  return toLocalDate(new Date());
}

export function addDays(value: LocalDate, days: number): LocalDate {
  const date = fromLocalDate(value);
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
}

/** Adds whole months, keeping the day but clamping to the month's end (Jan 31 + 1 = Feb 28). */
export function addMonths(value: LocalDate, months: number): LocalDate {
  const [y, m, d] = value.split('-').map(Number);
  const first = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return toLocalDate(new Date(first.getFullYear(), first.getMonth(), Math.min(d, lastDay)));
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((fromLocalDate(to).getTime() - fromLocalDate(from).getTime()) / 86_400_000);
}

/** "Sat, Oct 18" in the device locale. */
export function formatShortDate(value: LocalDate): string {
  return fromLocalDate(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "Nov 12" in the device locale. */
export function formatMonthDay(value: LocalDate): string {
  return fromLocalDate(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "October 2026" in the device locale. */
export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
