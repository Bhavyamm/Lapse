import { chargesBetween } from '@/features/subscriptions/calendar';
import { formatMoney } from '@/features/subscriptions/billing';
import type { BillingCycle, Subscription } from '@/features/subscriptions/types';
import { addDays, daysBetween, formatShortDate, fromLocalDate, toLocalDate, type LocalDate } from '@/utils/dates';

import type { ReminderLead } from './lead-time';
import { reminderAt } from './when';

/** iOS keeps 64 pending notifications per app; stay under it and top up when the app opens. */
export const MAX_REMINDERS = 60;
/** How far ahead reminders are scheduled. The rest are added on later app opens. */
export const HORIZON_DAYS = 90;
/** The hour "Remind me tonight" aims for. */
export const TONIGHT_HOUR = 20;

export const TRIAL_CATEGORY = 'trial';

export type ReminderKind = 'trial' | 'renewal';
export type ReminderData = { subscriptionId: string; kind: ReminderKind; chargeOn: LocalDate };

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
    body: `${formatMoney(sub.priceCents)} ${CYCLE_WORD[sub.cycle]}, renews ${formatShortDate(chargeOn)}`,
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
    const at = reminderAt(on, sub.lead ?? settings.reminderLead);
    if (at.getTime() <= now.getTime()) continue;
    planned.push(reminder(sub, on, trialEnding ? 'trial' : 'renewal', at, `${sub.id}:${on}`));
  }

  for (const sub of subs) {
    if (!sub.snoozeUntil || sub.snoozeUntil <= now.getTime() || !sub.trial || sub.trialKept) continue;
    // Only while the trial is still running.
    if (toLocalDate(new Date(sub.snoozeUntil)) > sub.chargeOn) continue;
    planned.push(reminder(sub, sub.chargeOn, 'trial', new Date(sub.snoozeUntil), `${sub.id}:snooze`));
  }

  return planned.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_REMINDERS);
}

/** When "Remind me tonight" fires: 8 PM today, or an hour from now if that's too close or gone. */
export function tonight(now: Date): Date {
  const at = new Date(now);
  at.setHours(TONIGHT_HOUR, 0, 0, 0);
  if (at.getTime() - now.getTime() < 15 * 60 * 1000) return new Date(now.getTime() + 60 * 60 * 1000);
  return at;
}
