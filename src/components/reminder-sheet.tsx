import { useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { BottomSheet } from '@/components/bottom-sheet';
import { Chip } from '@/components/chip';
import { CloseIcon } from '@/components/icons';
import { Toggle } from '@/components/toggle';
import { REMINDER_LEADS } from '@/features/reminders/lead-time';
import { requestReminderPermission } from '@/features/reminders/permissions';
import { useLock } from '@/stores/lock';
import { useSettings } from '@/stores/settings';
import { colors, fonts, radii, spacing } from '@/theme';

/** Bottom sheet to turn reminders on or off and pick how early they come. */
export function ReminderSheet({ visible: wanted, onClose }: { visible: boolean; onClose: () => void }) {
  // Modals draw above the Face ID lock, so they step aside while it is up.
  const locked = useLock((s) => s.locked);
  return (
    <BottomSheet visible={wanted} hideNow={locked} onClose={onClose}>
      <Sheet onClose={onClose} />
    </BottomSheet>
  );
}

function Sheet({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const enabled = useSettings((s) => s.remindersEnabled);
  const lead = useSettings((s) => s.reminderLead);
  const setEnabled = useSettings((s) => s.setRemindersEnabled);
  const setLead = useSettings((s) => s.setReminderLead);
  const [blocked, setBlocked] = useState(false);
  // A ref, not state, so two quick taps can't both start a permission request.
  const asking = useRef(false);

  const toggle = async () => {
    if (enabled) return setEnabled(false);
    if (asking.current) return;
    asking.current = true;
    const allowed = await requestReminderPermission();
    asking.current = false;
    setEnabled(allowed);
    setBlocked(!allowed);
  };

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.header}>
        <AppText variant="headline" style={styles.title}>
          Reminders
        </AppText>
        <Pressable role="button" aria-label="Close" onPress={onClose} style={styles.close} hitSlop={8}>
          <CloseIcon size={16} color={colors.ink} />
        </Pressable>
      </View>

      <Pressable role="switch" aria-checked={enabled} aria-label="Remind me" onPress={toggle} style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <AppText variant="section">Remind me</AppText>
          <AppText variant="caption" muted>
            Before trials end and renewals charge. Reminders stay on your phone.
          </AppText>
        </View>
        <Toggle on={enabled} />
      </Pressable>

      {blocked ? (
        <View style={styles.blocked} role="alert">
          <AppText variant="label">
            {Platform.OS === 'web'
              ? 'Reminders work in the app on your phone.'
              : 'Notifications are off for lapse. Turn them on in Settings.'}
          </AppText>
          {Platform.OS === 'web' ? null : (
            <Pressable role="link" onPress={() => Linking.openSettings()} style={styles.settingsPress}>
              <AppText variant="label" style={styles.settingsLink}>
                Open Settings
              </AppText>
            </Pressable>
          )}
        </View>
      ) : null}

      <AppText variant="section" style={styles.label}>
        When
      </AppText>
      <View style={styles.chips} role="radiogroup" aria-label="When to remind you">
        {REMINDER_LEADS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={option.value === lead}
            onPress={() => setLead(option.value)}
            onWhite
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.large,
    borderTopRightRadius: radii.large,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    flex: 1,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  toggleText: {
    flex: 1,
  },
  blocked: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.canvas,
    gap: spacing.xs,
  },
  settingsPress: {
    minHeight: 44,
    justifyContent: 'center',
  },
  settingsLink: {
    fontFamily: fonts.semibold,
    textDecorationLine: 'underline',
  },
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
