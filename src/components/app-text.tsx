import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, maxScale, type, type TypeVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypeVariant;
  /** Uses the secondary text color for the surface it sits on. */
  muted?: boolean;
  /** Set when the text sits on a charcoal surface. */
  onDark?: boolean;
};

export function AppText({ variant = 'body', muted, onDark, style, ...rest }: Props) {
  const color = onDark
    ? muted
      ? colors.textOnDarkSecondary
      : colors.white
    : muted
      ? colors.textSecondary
      : colors.ink;
  return (
    <Text maxFontSizeMultiplier={maxScale[variant]} style={[type[variant], styles.base, { color }, style]} {...rest} />
  );
}

const styles = StyleSheet.create({
  base: {
    fontVariant: ['tabular-nums'],
  },
});
