import { StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { GlassCard } from '@/components/cards';
import { spacing } from '@/theme';

/** Placeholder card for screens that later pull requests fill in. */
export function ComingSoon({ text }: { text: string }) {
  return (
    <GlassCard contentStyle={styles.content}>
      <AppText variant="section">Coming soon</AppText>
      <AppText variant="caption" muted>
        {text}
      </AppText>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.xs,
  },
});
