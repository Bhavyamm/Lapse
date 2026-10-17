import * as Notifications from 'expo-notifications';
import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { tonight, type ReminderData } from '@/features/reminders/plan';
import { syncReminders, TRIAL_ACTIONS } from '@/features/reminders/sync';
import { nextChargeDate } from '@/features/subscriptions/billing';
import { useSettings } from '@/stores/settings';
import { useSubscriptions } from '@/stores/subscriptions';
import { today } from '@/utils/dates';
import { notify } from '@/utils/notify';

/**
 * Keeps the phone's scheduled reminders in step with the subscriptions and settings, and acts on
 * taps and buttons on a reminder. Renders nothing; mount once, after the stores are loaded.
 */
export function Reminders() {
  if (Platform.OS === 'web') return null;
  return <NativeReminders />;
}

function NativeReminders() {
  useEffect(() => {
    const sync = () => {
      const { remindersEnabled, reminderLead } = useSettings.getState();
      syncReminders(useSubscriptions.getState().subscriptions, { remindersEnabled, reminderLead });
    };
    sync();
    const offSubs = useSubscriptions.subscribe((s, prev) => s.subscriptions !== prev.subscriptions && sync());
    const offSettings = useSettings.subscribe(
      (s, prev) => (s.remindersEnabled !== prev.remindersEnabled || s.reminderLead !== prev.reminderLead) && sync(),
    );
    // Reminders are scheduled a few months ahead; each return to the app tops them up.
    const offApp = AppState.addEventListener('change', (state) => state === 'active' && sync());
    return () => {
      offSubs();
      offSettings();
      offApp.remove();
    };
  }, []);

  useReminderResponses();
  return null;
}

function useReminderResponses() {
  const response = Notifications.useLastNotificationResponse();
  const navigationReady = !!useRootNavigationState()?.key;
  const hasOnboarded = useSettings((s) => s.hasOnboarded);
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (!response || !navigationReady || !hasOnboarded) return;
    const { notification, actionIdentifier } = response;
    const key = `${notification.request.identifier}|${notification.date}|${actionIdentifier}`;
    if (handled.current.has(key)) return;
    handled.current.add(key);
    Notifications.clearLastNotificationResponse();
    handleResponse(notification.request.content.data as Partial<ReminderData> | undefined, actionIdentifier);
  }, [response, navigationReady, hasOnboarded]);
}

/** What a tap or a button on a reminder does. Exported for tests. */
export function handleResponse(data: Partial<ReminderData> | undefined, action: string) {
  const id = data?.subscriptionId;
  if (!id) return;
  const store = useSubscriptions.getState();
  const sub = store.subscriptions.find((s) => s.id === id);
  const trialRunning = !!sub?.trial && nextChargeDate(sub, today()) === sub.chargeOn;

  if (action === TRIAL_ACTIONS.tonight) {
    if (!sub) return;
    const at = tonight(new Date());
    store.update(id, { snoozeUntil: at.getTime() });
    const time = at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    notify('Okay', `We’ll remind you about ${sub.name} at ${time}.`);
    return;
  }
  if (action === TRIAL_ACTIONS.keep) {
    if (!sub) return;
    store.update(id, { trialKept: true, snoozeUntil: undefined });
    notify('Got it', `No more reminders about the ${sub.name} trial.`);
    return;
  }
  if (action === TRIAL_ACTIONS.cancel || !trialRunning) {
    router.push({ pathname: '/subscription/[id]', params: { id } });
    return;
  }
  router.push({ pathname: '/trial/[id]', params: { id } });
}
