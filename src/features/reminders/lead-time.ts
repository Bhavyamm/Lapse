/** How early a reminder fires before a trial ends or a renewal charges. */
export type ReminderLead = 'threeDays' | 'oneDay' | 'morningOf';

export const REMINDER_LEADS: readonly { value: ReminderLead; label: string }[] = [
  { value: 'threeDays', label: '3 days before' },
  { value: 'oneDay', label: '1 day before' },
  { value: 'morningOf', label: 'Morning of' },
];

export const DEFAULT_REMINDER_LEAD: ReminderLead = 'oneDay';
