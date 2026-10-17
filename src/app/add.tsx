import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComingSoon } from '@/components/coming-soon';
import { CloseIcon } from '@/components/icons';
import { ScreenBackground } from '@/components/screen-background';
import { ScreenHeader } from '@/components/screen-header';
import { colors, radii, spacing } from '@/theme';

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScreenBackground style={[styles.root, { paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader
        title="Add a subscription"
        right={
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.close}>
            <CloseIcon color={colors.white} />
          </Pressable>
        }
      />
      <View style={styles.body}>
        <ComingSoon text="Search 300 popular services, or add your own." />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.lg,
  },
  close: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    marginTop: spacing.md,
  },
});
