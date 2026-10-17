import { ComingSoon } from '@/components/coming-soon';
import { ChevronIcon } from '@/components/icons';
import { PillButton } from '@/components/pill-button';
import { ScreenHeader } from '@/components/screen-header';
import { TabScreen } from '@/components/tab-screen';
import { useSettings } from '@/stores/settings';
import { colors, spacing } from '@/theme';

export default function ProfileScreen() {
  const resetOnboarding = useSettings((s) => s.resetOnboarding);
  return (
    <TabScreen>
      <ScreenHeader title="Profile" />
      <ComingSoon text="Money saved, reminder settings, Face ID and Pro." />
      {__DEV__ && (
        // Development builds only: onboarding shows once, so this brings it back for testing.
        // Clearing hasOnboarded flips the Stack.Protected guards and the root layout opens reminders.
        <PillButton
          label="Show onboarding again"
          tone="dark"
          icon={<ChevronIcon color={colors.ink} />}
          onPress={resetOnboarding}
          style={{ marginTop: spacing.md }}
        />
      )}
    </TabScreen>
  );
}
