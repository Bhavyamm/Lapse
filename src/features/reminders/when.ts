import { addDays, fromLocalDate, type LocalDate } from '@/utils/dates';

import type { ReminderLead } from './lead-time';

/** Reminders go out at 9:00 in the morning, phone time. */
export const REMINDER_HOUR = 9;

const DAYS_BEFORE: Record<ReminderLead, number> = { threeDays: 3, oneDay: 1, morningOf: 0 };

/** The day the reminder for a charge on `chargeOn` goes out. */
export function reminderDay(chargeOn: LocalDate, lead: ReminderLead): LocalDate {
  return addDays(chargeOn, -DAYS_BEFORE[lead]);
}

/** When the reminder for a charge on `chargeOn` fires. */
export function reminderAt(chargeOn: LocalDate, lead: ReminderLead): Date {
  const date = fromLocalDate(reminderDay(chargeOn, lead));
  date.setHours(REMINDER_HOUR, 0, 0, 0);
  return date;
}

/** "Fri, 9:00 AM" in the device locale. */
export function formatReminder(at: Date): string {
  const day = at.toLocaleDateString(undefined, { weekday: 'short' });
  const time = at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time}`;
}
