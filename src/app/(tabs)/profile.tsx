import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigAmount } from '@/components/big-amount';
import { CharcoalCard, GlassCard } from '@/components/cards';
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  CurrencyIcon,
  DocumentIcon,
  LockIcon,
  ProfileIcon,
  ShareIcon,
  TrashIcon,
} from '@/components/icons';
import { PressScale } from '@/components/press-scale';
import { ReminderSheet } from '@/components/reminder-sheet';
import { ScreenHeader } from '@/components/screen-header';
import { SettingsRow } from '@/components/settings-row';
import { TabScreen } from '@/components/tab-screen';
import { useToday } from '@/hooks/use-today';
import { getBiometrics, unlock, type Biometrics } from '@/features/lock/biometrics';
import { PRO_PRICE, usePro } from '@/features/pro/purchase';
import { REMINDER_LEADS } from '@/features/reminders/lead-time';
import { toCsv } from '@/features/subscriptions/csv';
import { dueCount } from '@/features/subscriptions/check-in';
import { shareCsv } from '@/features/subscriptions/export';
import { summarizeSavings } from '@/features/subscriptions/savings';
import { useSettings } from '@/stores/settings';
import { useSubscriptions } from '@/stores/subscriptions';
import { colors, fonts, radii, spacing } from '@/theme';
import { success } from '@/utils/haptics';
import { confirm, notify } from '@/utils/notify';

/** Money saved, settings, and data import and export. */
export default function ProfileScreen() {
  const isPro = usePro((s) => s.isPro);
  return (
    <TabScreen>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <ProfileIcon size={26} color={colors.ink} />
        </View>
        <View style={styles.headerText}>
          <ScreenHeader title="Profile" subtitle={`${isPro ? 'Pro' : 'Free plan'} · Data stays on this phone`} />
        </View>
      </View>
      <SavingsCard />
      <SettingsCard />
      <DataCard />
    </TabScreen>
  );
}

// Navigate, not push, so a double tap can't stack two Pro screens.
const openPro = () => router.navigate('/pro');

function SavingsCard() {
  const today = useToday();
  const tracked = useSubscriptions((s) => s.subscriptions.length);
  const cancelled = useSubscriptions((s) => s.cancelled);
  const savings = useMemo(() => summarizeSavings(cancelled, today), [cancelled, today]);
  const isPro = usePro((s) => s.isPro);
  const price = usePro((s) => s.price) ?? PRO_PRICE;
  const stats = [
    { value: tracked, label: 'Tracked' },
    { value: savings.cancelled, label: 'Cancelled' },
    { value: savings.trialsCaught, label: savings.trialsCaught === 1 ? 'Trial caught' : 'Trials caught' },
  ];
  return (
    <CharcoalCard contentStyle={styles.savings}>
      <View style={styles.savedTitle}>
        <View style={styles.dot} />
        <AppText variant="label" onDark muted>
          Saved since you started
        </AppText>
      </View>
      <BigAmount cents={savings.savedCents} />
      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat} accessible aria-label={`${stat.value} ${stat.label}`}>
            <AppText variant="section" onDark>
              {stat.value}
            </AppText>
            <AppText variant="caption" onDark muted>
              {stat.label}
            </AppText>
          </View>
        ))}
      </View>
      {isPro ? null : (
        <PressScale role="button" aria-label={`Unlock Pro, ${price} once`} onPress={openPro} style={[styles.pro]}>
          <AppText variant="link" style={styles.proText}>
            Unlock Pro · {price} once
          </AppText>
          <View style={styles.proArrow}>
            <ArrowRightIcon size={16} color={colors.white} />
          </View>
        </PressScale>
      )}
    </CharcoalCard>
  );
}

function SettingsCard() {
  const remindersEnabled = useSettings((s) => s.remindersEnabled);
  const lead = useSettings((s) => s.reminderLead);
  const appLock = useSettings((s) => s.appLock);
  const setAppLock = useSettings((s) => s.setAppLock);
  const [editingReminders, setEditingReminders] = useState(false);
  const today = useToday();
  const subscriptions = useSubscriptions((s) => s.subscriptions);
  const toReview = useMemo(() => dueCount(subscriptions, today), [subscriptions, today]);
  const [biometrics, setBiometrics] = useState<Biometrics | null>(null);
  const confirming = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getBiometrics().then((b) => !cancelled && setBiometrics(b));
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleLock = async (on: boolean) => {
    if (!on) return setAppLock(false);
    if (confirming.current) return;
    // Check Face ID works before relying on it to open the app.
    confirming.current = true;
    const result = await unlock(`Turn on ${biometrics?.name ?? 'Face ID'} lock`);
    confirming.current = false;
    if (result === 'unlocked') setAppLock(true);
  };

  const leadLabel = REMINDER_LEADS.find((l) => l.value === lead)?.label ?? '';
  return (
    <GlassCard radius={26} contentStyle={styles.card}>
      <SettingsRow
        icon={<BellIcon size={18} color={colors.ink} />}
        label="Reminders"
        detail={remindersEnabled ? leadLabel : 'Off'}
        onPress={() => setEditingReminders(true)}
        divider={false}
      />
      <SettingsRow
        icon={<CalendarIcon size={18} color={colors.ink} />}
        label="Monthly check-in"
        detail={toReview ? `${toReview} to look over` : '1st of month'}
        onPress={subscriptions.length ? () => router.push('/check-in') : undefined}
      />
      <SettingsRow icon={<CurrencyIcon color={colors.ink} />} label="Currency" detail="USD" />
      {Platform.OS === 'web' || !biometrics ? null : (
        <SettingsRow
          icon={<LockIcon size={18} color={colors.ink} />}
          label={`${biometrics.name} lock`}
          detail={biometrics.ready ? undefined : 'Set up on your phone first'}
          toggle={{ on: appLock, onChange: toggleLock, disabled: !biometrics.ready && !appLock }}
        />
      )}
      <ReminderSheet visible={editingReminders} onClose={() => setEditingReminders(false)} />
    </GlassCard>
  );
}

function DataCard() {
  const subscriptions = useSubscriptions((s) => s.subscriptions);
  const today = useToday();
  const exporting = useRef(false);

  // Clearing everything can't be undone, so it asks first. With onboarding reset, the app goes
  // back to its first-run screen, and the reminder sync cancels every scheduled reminder.
  const clearing = useRef(false);
  const clearAll = async () => {
    if (clearing.current) return;
    clearing.current = true;
    const yes = await confirm(
      'Clear all your data?',
      'Your subscriptions, savings and settings are removed from this phone. This can’t be undone.',
      'Clear everything',
      { cancel: 'Keep my data', destructive: true },
    );
    clearing.current = false;
    if (!yes) return;
    useSubscriptions.getState().clear();
    useSettings.getState().reset();
    success();
  };

  const exportCsv = async () => {
    if (exporting.current) return;
    exporting.current = true;
    try {
      const shared = await shareCsv(toCsv(subscriptions, today), `lapse-subscriptions-${today}.csv`);
      if (!shared) notify('Can’t share files', 'This device has no way to share a file.');
    } catch {
      notify('Export failed', 'Something went wrong making the file. Try again.');
    } finally {
      exporting.current = false;
    }
  };

  return (
    <GlassCard radius={26} contentStyle={styles.card}>
      <SettingsRow
        icon={<DocumentIcon color={colors.ink} />}
        label="Import a statement"
        badge={
          <View style={styles.proTag}>
            <AppText variant="caption" onDark style={styles.proTagText}>
              PRO
            </AppText>
          </View>
        }
        onPress={openPro}
        divider={false}
      />
      <SettingsRow
        icon={<ShareIcon color={colors.ink} />}
        label="Export as CSV"
        detail={subscriptions.length ? undefined : 'Nothing yet'}
        onPress={subscriptions.length ? exportCsv : undefined}
      />
      <SettingsRow icon={<TrashIcon color={colors.danger} />} label="Clear all data" onPress={clearAll} destructive />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  headerText: {
    flex: 1,
  },
  savings: {
    padding: 20,
    gap: spacing.lg,
  },
  savedTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.onDarkPanel,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  pro: {
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 6,
  },
  proText: {
    color: colors.ink,
    fontFamily: fonts.bold,
  },
  proArrow: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
  },
  proTag: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  proTagText: {
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
});
