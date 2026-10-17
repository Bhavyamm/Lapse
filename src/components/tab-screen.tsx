import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/screen-background';
import { spacing, tabBar } from '@/theme';

/** Scrollable page for a tab, on the blob background, clear of the floating nav. */
export function TabScreen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: Math.max(insets.bottom, tabBar.bottomGap) + tabBar.height + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
