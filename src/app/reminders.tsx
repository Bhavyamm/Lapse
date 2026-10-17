import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { CharcoalCard } from '@/components/cards';
import { Chip } from '@/components/chip';
import { BellIcon } from '@/components/icons';
import { Mascot } from '@/components/mascot';
import { NotificationPreview } from '@/components/notification-preview';
import { PillButton } from '@/components/pill-button';
import { ScreenBackground } from '@/components/screen-background';
import { REMINDER_LEADS } from '@/features/reminders/lead-time';
import { requestReminderPermission } from '@/features/reminders/permissions';
import { useSettings } from '@/stores/settings';
import { colors, spacing } from '@/theme';

/** Second onboarding screen: pick reminder timing and allow notifications. */
export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const reminderLead = useSettings((s) => s.reminderLead);
  const setReminderLead = useSettings((s) => s.setReminderLead);
  const completeOnboarding = useSettings((s) => s.completeOnboarding);
  const [asking, setAsking] = useState(false);
  // A ref, not state, so two quick taps can't both start a request.
  const busy = useRef(false);

  const finish = (remindersEnabled: boolean) => {
    completeOnboarding(remindersEnabled);
    router.replace('/');
  };

  const skip = () => {
    if (busy.current) return;
    busy.current = true;
    finish(false);
  };

  const turnOn = async () => {
    if (busy.current) return;
    busy.current = true;
    setAsking(true);
    finish(await requestReminderPermission());
  };

  return (
    <ScreenBackground
      style={[styles.root, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <CharcoalCard radius={32} style={styles.preview} contentStyle={styles.previewContent}>
          <View style={styles.mascot} pointerEvents="none">
            <Mascot size={132} shadow={false} />
          </View>
          <NotificationPreview
            time="now"
            message="Your Duolingo Max trial ends tomorrow. Cancel now to skip the $29.99 charge."
          />
        </CharcoalCard>

        <View style={styles.copy}>
          <AppText variant="hero">{'Never get charged\nby surprise.'}</AppText>
          <AppText variant="lede" muted style={styles.body}>
            We’ll nudge you before trials end and renewals hit. Reminders stay on your phone.
          </AppText>
          <View style={styles.chips} role="radiogroup" aria-label="When to remind you">
            {REMINDER_LEADS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={option.value === reminderLead}
                onPress={() => setReminderLead(option.value)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <PillButton
          label={asking ? 'Asking your phone…' : 'Turn on reminders'}
          icon={<BellIcon color={colors.white} />}
          onPress={turnOn}
          disabled={asking}
        />
        <Pressable role="button" onPress={skip} style={styles.notNow}>
          <AppText variant="link" style={styles.notNowText}>
            Not now
          </AppText>
        </Pressable>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.lg,
  },
  scroll: {
    flex: 1,
    // Bleed to the screen edges so the card shadow isn't clipped.
    marginHorizontal: -spacing.lg,
  },
  scrollContent: {
    paddingTop: 96,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  preview: {},
  previewContent: {
    paddingTop: 52,
    paddingHorizontal: spacing.lg,
    paddingBottom: 18,
  },
  mascot: {
    position: 'absolute',
    right: 6,
    top: -88,
  },
  copy: {
    paddingTop: 24,
    paddingHorizontal: 4,
  },
  body: {
    marginTop: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  actions: {
    gap: 6,
  },
  notNow: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notNowText: {
    color: colors.inkSoft,
  },
});
