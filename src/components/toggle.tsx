import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { colors } from '@/theme';
import { prefersReducedMotion, SETTLE } from '@/utils/motion';

/** The on/off track drawn inside a `role="switch"` row. The row owns the press and the label. */
export function Toggle({ on, disabled = false }: { on: boolean; disabled?: boolean }) {
  const [progress] = useState(() => new Animated.Value(on ? 1 : 0));
  useEffect(() => {
    if (prefersReducedMotion()) return progress.setValue(on ? 1 : 0);
    const slide = Animated.spring(progress, { toValue: on ? 1 : 0, ...SETTLE, useNativeDriver: true });
    slide.start();
    return () => slide.stop();
  }, [on, progress]);

  const knob = { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) }] };
  return (
    <View style={[styles.track, disabled && styles.disabled]}>
      <Animated.View style={[styles.fill, { opacity: progress }]} />
      <Animated.View style={[styles.knob, knob]}>
        <Animated.View style={[styles.knobOn, { opacity: progress }]}>
          <CheckIcon size={10} color={colors.ink} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.hairline,
    padding: 3,
  },
  fill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 14,
    backgroundColor: colors.ink,
  },
  disabled: {
    opacity: 0.4,
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  knobOn: {
    ...StyleSheet.absoluteFill,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
