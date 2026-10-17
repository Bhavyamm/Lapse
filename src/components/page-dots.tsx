import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/** Onboarding progress: the current page is a wide black pill. */
export function PageDots({ count, current }: { count: number; current: number }) {
  return (
    <View style={styles.row} accessible role="progressbar" aria-label={`Step ${current + 1} of ${count}`}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.dot, index === current && styles.current]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textOnDarkSecondary,
  },
  current: {
    width: 24,
    backgroundColor: colors.ink,
  },
});
