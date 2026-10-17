import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/app-text';
import { PressScale } from '@/components/press-scale';
import { colors, radii } from '@/theme';

type Props = {
  label: string;
  onPress?: () => void;
  icon: ReactNode;
  /** `accent` is the orange CTA; `dark` is the black pill. */
  tone?: 'accent' | 'dark';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Full-width pill CTA with a round icon button on its right end. */
export function PillButton({ label, onPress, icon, tone = 'accent', disabled, style }: Props) {
  const dark = tone === 'dark';
  return (
    <PressScale
      role="button"
      aria-disabled={!!disabled}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: dark ? colors.ink : colors.accent },
        disabled && styles.disabled,
        style,
      ]}>
      <AppText variant="button" style={{ color: dark ? colors.white : colors.ink }}>
        {label}
      </AppText>
      <View style={[styles.knob, { backgroundColor: dark ? colors.accent : colors.ink }]}>{icon}</View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
  button: {
    height: 60,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 26,
    paddingRight: 7,
  },
  knob: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
