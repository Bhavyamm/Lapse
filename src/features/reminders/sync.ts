import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Subscription } from '@/features/subscriptions/types';

import type { ReminderLead } from './lead-time';
import { REMINDER_CHANNEL_ID } from './permissions';
import { planReminders, TRIAL_CATEGORY } from './plan';

/** Buttons on a trial reminder. */
export const TRIAL_ACTIONS = { cancel: 'cancel', tonight: 'tonight', keep: 'keep' } as const;

let prepared: Promise<void> | null = null;

/** Shows reminders that arrive while lapse is open, and registers the trial reminder's buttons. Once per launch. */
function prepare(): Promise<void> {
  prepared ??= (async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    // Every button opens the app, so the choice is handled even if lapse wasn't running.
    await Notifications.setNotificationCategoryAsync(TRIAL_CATEGORY, [
      { identifier: TRIAL_ACTIONS.cancel, buttonTitle: 'Cancel the trial' },
      { identifier: TRIAL_ACTIONS.tonight, buttonTitle: 'Remind me tonight' },
      { identifier: TRIAL_ACTIONS.keep, buttonTitle: 'I’ll keep it' },
    ]);
  })().catch(() => {
    prepared = null;
  });
  return prepared;
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Replaces every scheduled lapse reminder with the ones `planReminders` wants now. Runs one at a
 * time, so quick changes in a row can't interleave and leave duplicates. Never throws.
 */
export function syncReminders(
  subscriptions: Subscription[],
  settings: { remindersEnabled: boolean; reminderLead: ReminderLead },
): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  const run = async () => {
    try {
      await prepare();
      const planned = planReminders(subscriptions, settings, new Date());
      await Notifications.cancelAllScheduledNotificationsAsync();
      for (const r of planned) {
        await Notifications.scheduleNotificationAsync({
          identifier: r.id,
          content: { title: r.title, body: r.body, data: r.data, categoryIdentifier: r.category },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: r.at,
            channelId: REMINDER_CHANNEL_ID,
          },
        });
      }
    } catch {
      // A phone that refuses to schedule leaves the old reminders; the next change or app open tries again.
    }
  };
  const next = queue.then(run);
  queue = next;
  return next;
}

/**
 * Development builds only: shows the next real reminder (a trial's first) a few seconds from now,
 * so the lock-screen reminder and its buttons can be tried without waiting. False when there is
 * nothing to remind about.
 */
export async function sendTestReminder(subscriptions: Subscription[], reminderLead: ReminderLead): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await prepare();
  const planned = planReminders(subscriptions, { remindersEnabled: true, reminderLead }, new Date());
  const pick = planned.find((r) => r.data.kind === 'trial') ?? planned[0];
  if (!pick) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: pick.title, body: pick.body, data: pick.data, categoryIdentifier: pick.category },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
  return true;
}
