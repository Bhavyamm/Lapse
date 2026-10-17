import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip';
import { ArrowUpRightIcon, BellIcon, CloseIcon } from '@/components/icons';
import { PillButton } from '@/components/pill-button';
import { ServiceLogo } from '@/components/service-logo';
import { useToday } from '@/hooks/use-today';
import { REMINDER_LEADS } from '@/features/reminders/lead-time';
import { formatReminder, reminderAt } from '@/features/reminders/when';
import { formatMoney, nextChargeDate, yearlyCents } from '@/features/subscriptions/billing';
import type { BillingCycle, Subscription } from '@/features/subscriptions/types';
import { useSettings } from '@/stores/settings';
import { useSubscriptions } from '@/stores/subscriptions';
import { colors, fonts, radii, spacing } from '@/theme';
import { daysBetween, formatShortDate, fromLocalDate, type LocalDate } from '@/utils/dates';

const CYCLE_WORD: Record<BillingCycle, string> = { week: 'a week', month: 'a month', year: 'a year' };

/** A running free trial: how long is left, what it costs after, the reminder, and the way out. */
export default function TrialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sub = useSubscriptions((s) => s.subscriptions.find((x) => x.id === id));
  const today = useToday();
  // Once the trial is over (or the subscription is gone) the detail screen says the rest.
  if (!sub || !sub.trial || nextChargeDate(sub, today) !== sub.chargeOn) {
    return <Redirect href={{ pathname: '/subscription/[id]', params: { id: id ?? '' } }} />;
  }
  return <Trial sub={sub} today={today} />;
}

const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** "Saturday", or the date when it's more than a week away. */
function endsWord(date: LocalDate, days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 7) return fromLocalDate(date).toLocaleDateString(undefined, { weekday: 'long' });
  return `on ${formatShortDate(date)}`;
}

function Trial({ sub, today }: { sub: Subscription; today: LocalDate }) {
  const insets = useSafeAreaInsets();
  const update = useSubscriptions((s) => s.update);
  const remindersOn = useSettings((s) => s.remindersEnabled);
  const globalLead = useSettings((s) => s.reminderLead);
  const lead = sub.lead ?? globalLead;
  // Read once when the screen opens; enough to tell whether today's reminder has gone out.
  const [now] = useState(Date.now);

  const days = daysBetween(today, sub.chargeOn);
  const ends = endsWord(sub.chargeOn, days);
  const price = `${formatMoney(sub.priceCents)} ${CYCLE_WORD[sub.cycle]}`;
  const at = reminderAt(sub.chargeOn, lead);
  const reminderText = !remindersOn
    ? 'Reminders are off'
    : sub.remind === false
      ? 'Off for this trial. Pick a time to turn it on.'
      : at.getTime() <= now
        ? 'That time has passed'
        : formatReminder(at);
  const cancelBy = days < 2 ? 'Cancel it now' : `Cancel before ${days < 7 ? ends : formatShortDate(sub.chargeOn)}`;
  // Replace this screen so leaving the detail (after cancelling or editing) doesn't come back to a stale trial.
  const openCancel = () => router.replace({ pathname: '/subscription/[id]', params: { id: sub.id } });

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.sm }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Pressable role="button" aria-label="Close" onPress={leave} hitSlop={6} style={styles.close}>
            <CloseIcon size={16} color={colors.ink} />
          </Pressable>
          <View style={styles.tag}>
            <AppText variant="caption" onDark style={styles.bold}>
              Free trial
            </AppText>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.logo}>
            <ServiceLogo serviceId={sub.serviceId} name={sub.name} size={64} />
          </View>
          {days === 0 ? (
            <AppText variant="countdown" role="heading">
              Today
            </AppText>
          ) : (
            <View
              style={styles.count}
              role="heading"
              accessible
              aria-label={`${days} ${days === 1 ? 'day' : 'days'} left`}>
              <AppText variant="countdown">{days}</AppText>
              <AppText variant="hero">{days === 1 ? 'day left' : 'days left'}</AppText>
            </View>
          )}
          <AppText variant="body" style={styles.lede}>
            Your {sub.name} trial ends {ends}. After that it’s {price}.
          </AppText>
        </View>

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
          <View style={styles.facts}>
            <Fact label="First charge" value={formatShortDate(sub.chargeOn)} />
            <Fact label="If you keep it" value={`${formatMoney(yearlyCents(sub.priceCents, sub.cycle))}/yr`} />
          </View>

          <View style={styles.reminder}>
            <View style={styles.reminderTop}>
              <View style={styles.bell}>
                <BellIcon size={19} color={colors.accent} />
              </View>
              <View style={styles.flex}>
                <AppText variant="caption" muted>
                  We’ll remind you
                </AppText>
                <AppText variant="bodyStrong">{reminderText}</AppText>
              </View>
            </View>
            {remindersOn && (
              <View style={styles.chips} role="radiogroup" aria-label="Reminder timing">
                {REMINDER_LEADS.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    selected={option.value === lead}
                    // Picking a time also turns this trial's reminder back on.
                    onPress={() => update(sub.id, { lead: option.value, remind: true })}
                    onWhite
                  />
                ))}
              </View>
            )}
          </View>
          <AppText variant="caption" muted style={styles.tip}>
            Cancelling early is safe: most apps let you keep the trial until {formatShortDate(sub.chargeOn)}.
          </AppText>

          <View style={styles.actions}>
            <PillButton
              label={cancelBy}
              tone="dark"
              icon={<ArrowUpRightIcon color={colors.ink} />}
              onPress={openCancel}
            />
            <Pressable
              role="button"
              onPress={leave}
              style={({ pressed }) => [styles.keep, pressed && { opacity: 0.8 }]}>
              <AppText variant="link">I’ll keep it</AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact} accessible aria-label={`${label}: ${value}`}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={styles.factValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accent,
  },
  scroll: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.inkWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: 14,
  },
  hero: {
    paddingTop: 26,
    paddingHorizontal: 24,
    paddingBottom: 30,
    gap: 6,
  },
  logo: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    borderRadius: 19,
    boxShadow: '0 12px 24px rgba(20,20,20,0.18)',
  },
  count: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  lede: {
    marginTop: spacing.md,
    fontFamily: fonts.medium,
  },
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.sheetOnAccent,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 18,
  },
  facts: {
    flexDirection: 'row',
    gap: 10,
  },
  fact: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  factValue: {
    marginTop: 2,
  },
  reminder: {
    borderWidth: 1.5,
    borderColor: colors.divider,
    borderRadius: 22,
    padding: spacing.md,
    gap: spacing.md,
  },
  reminderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: radii.icon,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tip: {
    paddingHorizontal: 4,
    marginTop: -6,
  },
  actions: {
    marginTop: 'auto',
    gap: 10,
  },
  keep: {
    minHeight: 56,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
