import { AccessibilityInfo, LayoutAnimation, Platform } from 'react-native';

/** The phone's Reduce Motion setting, kept current for code that can't use a hook. */
let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((on) => {
    reduceMotion = on;
  })
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (on) => {
  reduceMotion = on;
});

export function prefersReducedMotion(): boolean {
  return reduceMotion;
}

/** Spring used for things settling into place: quick, with no visible bounce. */
export const SETTLE = { damping: 24, stiffness: 260, mass: 0.9 } as const;

/**
 * Animates the next layout change (rows added, removed or reordered) with a soft ease, so lists
 * glide instead of jumping. Call it right before the state change.
 */
export function animateLayout(duration = 240) {
  if (reduceMotion || Platform.OS === 'web') return;
  LayoutAnimation.configureNext({
    duration,
    create: { type: 'easeInEaseOut', property: 'opacity' },
    update: { type: 'easeInEaseOut' },
    delete: { type: 'easeInEaseOut', property: 'opacity' },
  });
}
