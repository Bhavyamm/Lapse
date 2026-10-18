import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

/** Android channel that every lapse reminder is posted to. */
export const REMINDER_CHANNEL_ID = 'reminders';

/**
 * Asks the OS to allow local notifications. Resolves to whether reminders can
 * be shown. Never throws: a platform without local notifications (web) or a
 * failed request counts as "not allowed", so onboarding can always continue.
 */
export async function requestReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    // Android 13+ only shows the permission prompt once a channel exists.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
        name: 'Reminders',
        importance: AndroidImportance.HIGH,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  } catch {
    return false;
  }
}
