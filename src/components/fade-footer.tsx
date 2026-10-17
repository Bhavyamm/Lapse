import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors } from '@/theme';

/**
 * Buttons pinned to the bottom of a scrolling screen. Content scrolling under them fades into
 * the canvas instead of running into the buttons.
 */
export function FadeFooter({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.footer, style]} {...rest}>
      <LinearGradient
        colors={[colors.canvasClear, colors.canvas, colors.canvas]}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 36,
  },
});
