import { StyleSheet, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { colors } from '@/theme';

/** The on/off track drawn inside a `role="switch"` row. The row owns the press and the label. */
export function Toggle({ on, disabled = false }: { on: boolean; disabled?: boolean }) {
  return (
    <View style={[styles.track, on && styles.trackOn, disabled && styles.disabled]}>
      <View style={[styles.knob, on && styles.knobOn]}>{on ? <CheckIcon size={10} color={colors.ink} /> : null}</View>
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
  trackOn: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  knobOn: {
    backgroundColor: colors.accent,
    transform: [{ translateX: 18 }],
  },
});
