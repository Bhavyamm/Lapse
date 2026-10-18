import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptics complement what's on screen, so a phone without them (or the web build) just skips them.
function play(run: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  run().catch(() => {});
}

/** A choice changed: a switch, chip, segment or date. */
export const selection = () => play(() => Haptics.selectionAsync());

/** A quick decision landed, such as an answer in the check-in. */
export const tap = () => play(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

/** Something finished: subscriptions added, one marked cancelled, Pro unlocked. */
export const success = () => play(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

/** Something was blocked, such as Save with a missing price. */
export const error = () => play(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
