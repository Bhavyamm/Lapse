import { chargesBetween } from '@/features/subscriptions/calendar';
import { formatMoney } from '@/features/subscriptions/billing';
import type { BillingCycle, Subscription } from '@/features/subscriptions/types';
import {
  addDays,
  daysBetween,
  formatMonthDay,
  formatShortDate,
  fromLocalDate,
  toLocalDate,
  type LocalDate,
} from '@/utils/dates';

import type { ReminderLead } from './lead-time';
import { REMINDER_HOUR, reminderDay } from './when';

/** iOS keeps 64 pending notifications per app; stay under it and top up when the app opens. */
export const MAX_REMINDERS = 60;
/** How far ahead reminders are scheduled. The rest are added on later app opens. */
export const HORIZON_DAYS = 90;
/** The hour "Remind me tonight" aims for. */
export const TONIGHT_HOUR = 20;

export const TRIAL_CATEGORY = 'trial';

export type ReminderKind = 'trial' | 'renewal' | 'checkin';
export type ReminderData = {
  subscriptionId: string;
  kind: ReminderKind;
  chargeOn: LocalDate;
  /** Set on the development "Send a test reminder" one. */
  test?: boolean;
};

export type PlannedReminder = {
  /** Stable per subscription and charge, so a reschedule replaces rather than duplicates. */
  id: string;
  at: Date;
  title: string;
  body: string;
  data: ReminderData;
  category?: string;
};

const CYCLE_WORD: Record<BillingCycle, string> = { week: 'a week', month: 'a month', year: 'a year' };

/** "today", "tomorrow", "Saturday", or "on Oct 25", seen from the day the reminder arrives. */
export function dayWord(from: LocalDate, to: LocalDate): string {
  const days = daysBetween(from, to);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 7) return fromLocalDate(to).toLocaleDateString(undefined, { weekday: 'long' });
  return `on ${formatShortDate(to)}`;
}

/** The words of a reminder about `sub`'s charge on `chargeOn`, arriving at `at`. */
export function reminderContent(sub: Subscription, chargeOn: LocalDate, kind: ReminderKind, at: Date) {
  const day = toLocalDate(at);
  const when = dayWord(day, chargeOn);
  if (kind === 'trial') {
    const days = daysBetween(day, chargeOn);
    const by =
      days < 7 ? fromLocalDate(chargeOn).toLocaleDateString(undefined, { weekday: 'long' }) : formatShortDate(chargeOn);
    const before = days <= 0 ? 'Cancel today' : `Cancel before ${by}`;
    return {
      title: `${sub.name} trial ends ${when}`,
      body: `${before} to skip the ${formatMoney(sub.priceCents)} charge. It takes about a minute.`,
    };
  }
  return {
    title: `${sub.name} renews ${when}`,
    body: `${formatMoney(sub.priceCents)} ${CYCLE_WORD[sub.cycle]}, renews ${formatMonthDay(chargeOn)}`,
  };
}

function reminder(sub: Subscription, chargeOn: LocalDate, kind: ReminderKind, at: Date, id: string): PlannedReminder {
  return {
    id,
    at,
    ...reminderContent(sub, chargeOn, kind, at),
    data: { subscriptionId: sub.id, kind, chargeOn },
    category: kind === 'trial' ? TRIAL_CATEGORY : undefined,
  };
}

/**
 * Every reminder that should be waiting on the phone right now: one per upcoming charge in the
 * next HORIZON_DAYS, at each subscription's lead time, plus any "remind me tonight". Soonest
 * first, at most MAX_REMINDERS.
 */
export function planReminders(
  subscriptions: Subscription[],
  settings: { remindersEnabled: boolean; reminderLead: ReminderLead },
  now: Date,
): PlannedReminder[] {
  if (!settings.remindersEnabled) return [];
  const today = toLocalDate(now);
  const subs = subscriptions.filter((s) => s.remind !== false);
  const planned: PlannedReminder[] = [];

  for (const charge of chargesBetween(subs, today, addDays(today, HORIZON_DAYS))) {
    const { sub, on, trialEnding } = charge;
    if (trialEnding && sub.trialKept) continue;
    const at = firstReminderTime(on, sub.lead ?? settings.reminderLead, now);
    if (!at) continue;
    planned.push(reminder(sub, on, trialEnding ? 'trial' : 'renewal', at, `${sub.id}:${on}`));
  }

  for (const sub of subs) {
    if (!sub.snoozeUntil || sub.snoozeUntil <= now.getTime() || !sub.trial || sub.trialKept) continue;
    if (!snoozeFits(sub.snoozeUntil, sub.chargeOn)) continue;
    planned.push(reminder(sub, sub.chargeOn, 'trial', new Date(sub.snoozeUntil), `${sub.id}:snooze`));
  }

  planned.push(...checkInReminders(subscriptions, today, now));

  // Trial reminders and check-ins matter most, so the cap never drops one for a renewal.
  const byTime = (a: PlannedReminder, b: PlannedReminder) => a.at.getTime() - b.at.getTime();
  const first = planned.filter((r) => r.data.kind !== 'renewal').sort(byTime);
  const renewals = planned.filter((r) => r.data.kind === 'renewal').sort(byTime);
  return [...first, ...renewals].slice(0, MAX_REMINDERS).sort(byTime);
}

/**
 * When to remind about a charge on `chargeOn`: 9 AM on the lead day or, once that has passed (a
 * trial added two days before it ends with a 3-day lead), the next 9 AM up to the charge day.
 */
function firstReminderTime(chargeOn: LocalDate, lead: ReminderLead, now: Date): Date | null {
  for (let day = reminderDay(chargeOn, lead); day <= chargeOn; day = addDays(day, 1)) {
    const at = fromLocalDate(day);
    at.setHours(REMINDER_HOUR, 0, 0, 0);
    if (at.getTime() > now.getTime()) return at;
  }
  return null;
}

/** A "remind me tonight" only counts while the trial runs: up to the end of its last day. */
export function snoozeFits(at: number, chargeOn: LocalDate): boolean {
  return toLocalDate(new Date(at)) <= chargeOn;
}

/** 9 AM on the 1st of each month in the horizon, while there's anything to check in on. */
function checkInReminders(subscriptions: Subscription[], today: LocalDate, now: Date): PlannedReminder[] {
  if (!subscriptions.some((s) => !(s.trial && s.chargeOn >= today))) return [];
  const reminders: PlannedReminder[] = [];
  const last = addDays(today, HORIZON_DAYS);
  // From this month's 1st, in case today is the 1st and 9 AM hasn't come yet.
  for (let month = 0; ; month++) {
    const first = new Date(now.getFullYear(), now.getMonth() + month, 1, REMINDER_HOUR);
    const day = toLocalDate(first);
    if (day > last) break;
    if (first.getTime() <= now.getTime()) continue;
    reminders.push({
      id: `checkin:${day}`,
      at: first,
      title: 'Monthly check-in',
      body: 'Take a minute to see if your subscriptions are still worth it.',
      data: { subscriptionId: '', kind: 'checkin', chargeOn: day },
    });
  }
  return reminders;
}

/** When "Remind me tonight" fires: 8 PM today, or an hour from now if that's too close or gone. */
export function tonight(now: Date): Date {
  const at = new Date(now);
  at.setHours(TONIGHT_HOUR, 0, 0, 0);
  if (at.getTime() - now.getTime() < 15 * 60 * 1000) return new Date(now.getTime() + 60 * 60 * 1000);
  return at;
}
