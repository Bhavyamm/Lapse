import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { BigAmount } from '@/components/big-amount';
import { CheckIcon, ClockIcon, CloseIcon } from '@/components/icons';
import { Mascot } from '@/components/mascot';
import { PillButton } from '@/components/pill-button';
import { ScreenBackground } from '@/components/screen-background';
import { ServiceLogo } from '@/components/service-logo';
import { useToday } from '@/hooks/use-today';
import { describePrice, formatMoney, yearlyCents } from '@/features/subscriptions/billing';
import { addedOn, checkInQueue } from '@/features/subscriptions/check-in';
import { openDetail } from '@/features/subscriptions/open';
import { summarizeSavings } from '@/features/subscriptions/savings';
import type { Subscription } from '@/features/subscriptions/types';
import { useSubscriptions } from '@/stores/subscriptions';
import { colors, fonts, radii, spacing } from '@/theme';
import { formatMonthDay } from '@/utils/dates';

type Outcome = 'kept' | 'later';

const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** The monthly check-in: one subscription at a time, keep it, cancel it, or ask again next month. */
export default function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const today = useToday();
  const subscriptions = useSubscriptions((s) => s.subscriptions);
  const update = useSubscriptions((s) => s.update);
  // The list is fixed when the check-in opens, so keeping one doesn't reshuffle the rest.
  const [ids] = useState(() => checkInQueue(useSubscriptions.getState().subscriptions, today).map((s) => s.id));
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});

  const byId = useMemo(() => new Map(subscriptions.map((s) => [s.id, s])), [subscriptions]);
  const cancelledList = useSubscriptions((s) => s.cancelled);
  const cancelledIds = useMemo(() => new Set(cancelledList.map((c) => c.id)), [cancelledList]);
  // One that is gone without an answer was cancelled from its detail screen.
  const current = ids.find((id) => !outcomes[id] && byId.has(id));
  const sub = current ? byId.get(current) : undefined;

  const answer = (outcome: Outcome) => {
    if (!sub) return;
    update(sub.id, outcome === 'kept' ? { reviewedOn: today } : { skippedOn: today });
    setOutcomes((o) => ({ ...o, [sub.id]: outcome }));
  };

  return (
    <ScreenBackground
      style={[styles.screen, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.top}>
        <Pressable role="button" aria-label="Close" onPress={leave} hitSlop={6} style={styles.close}>
          <CloseIcon size={16} color={colors.ink} />
        </Pressable>
        {sub ? (
          <View style={styles.count}>
            <AppText variant="caption" style={styles.bold}>
              {ids.indexOf(sub.id) + 1} of {ids.length}
            </AppText>
          </View>
        ) : null}
      </View>
      {sub ? (
        <>
          <AppText variant="hero" role="heading">
            Still using this?
          </AppText>
          <ReviewCard sub={sub} />
          <View style={styles.actions}>
            <RoundAction
              label="Cancel it"
              hint={`Shows how to cancel ${sub.name}`}
              size={76}
              color={colors.ink}
              icon={<CloseIcon size={26} color={colors.white} />}
              onPress={() => openDetail(sub.id)}
            />
            <RoundAction
              label="Next month"
              size={56}
              color={colors.white}
              icon={<ClockIcon color={colors.ink} />}
              onPress={() => answer('later')}
            />
            <RoundAction
              label="Keep it"
              size={76}
              color={colors.accent}
              icon={<CheckIcon size={28} color={colors.ink} />}
              onPress={() => answer('kept')}
            />
          </View>
        </>
      ) : (
        <Finished ids={ids} outcomes={outcomes} cancelled={ids.filter((id) => !byId.has(id) && cancelledIds.has(id))} />
      )}
    </ScreenBackground>
  );
}

/** The white card with a charcoal and an orange card fanned out behind it. */
function ReviewCard({ sub }: { sub: Subscription }) {
  const today = useToday();
  const cancelled = useSubscriptions((s) => s.cancelled);
  const saved = useMemo(() => summarizeSavings(cancelled, today).savedCents, [cancelled, today]);
  const yearly = yearlyCents(sub.priceCents, sub.cycle);
  const since = sub.reviewedOn
    ? `Last reviewed ${formatMonthDay(sub.reviewedOn)}`
    : `Added ${formatMonthDay(addedOn(sub))}`;
  return (
    <View style={styles.stack}>
      <View style={[styles.behind, styles.behindDark]} />
      <View style={[styles.behind, styles.behindAccent]} />
      <View style={styles.card} accessible aria-label={`${sub.name}, ${formatMoney(yearly)} a year. ${since}`}>
        <View style={styles.cardTop}>
          <ServiceLogo serviceId={sub.serviceId} name={sub.name} size={64} />
          <View style={styles.since}>
            <AppText variant="caption" style={styles.sinceText}>
              {since}
            </AppText>
          </View>
        </View>
        <View>
          <AppText variant="title">{sub.name}</AppText>
          <BigAmount cents={yearly} suffix={sub.cycle === 'year' ? undefined : 'a year'} light style={styles.amount} />
          <AppText variant="lede" style={styles.note}>
            {sub.cycle === 'year' ? 'Billed once a year' : describePrice(sub.priceCents, sub.cycle)}.{' '}
            {saved
              ? `Cancelling would bring your savings to ${formatMoney(saved + yearly)} a year from now.`
              : 'Cancelling would save you that every year.'}
          </AppText>
        </View>
      </View>
    </View>
  );
}

type RoundActionProps = {
  label: string;
  hint?: string;
  size: number;
  color: string;
  icon: ReactNode;
  onPress: () => void;
};

function RoundAction({ label, hint, size, color, icon, onPress }: RoundActionProps) {
  return (
    <Pressable
      role="button"
      aria-label={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.8 }]}>
      <View style={[styles.round, { width: size, height: size, backgroundColor: color }]}>{icon}</View>
      <AppText variant="caption" style={styles.bold}>
        {label}
      </AppText>
    </Pressable>
  );
}

function Finished(props: { ids: string[]; outcomes: Record<string, Outcome>; cancelled: string[] }) {
  const { ids, outcomes, cancelled } = props;
  const kept = ids.filter((id) => outcomes[id] === 'kept').length;
  const later = ids.filter((id) => outcomes[id] === 'later').length;
  const parts = [
    kept ? `kept ${kept}` : null,
    cancelled.length ? `cancelled ${cancelled.length}` : null,
    later ? `left ${later} for next month` : null,
  ].filter((part): part is string => !!part);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];
  const summary = list ? `You ${list}.` : 'Add a subscription and it shows up here next month.';
  return (
    <View style={styles.done}>
      <Mascot size={150} />
      <AppText variant="hero" role="heading" style={styles.doneTitle}>
        {ids.length ? 'All checked' : 'Nothing to check'}
      </AppText>
      <AppText variant="lede" muted style={styles.doneText}>
        {summary} See you next month.
      </AppText>
      <PillButton
        label="Done"
        tone="dark"
        icon={<CheckIcon size={16} color={colors.ink} />}
        onPress={leave}
        style={styles.doneButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bold: {
    fontFamily: fonts.semibold,
  },
  stack: {
    height: 380,
    marginTop: 6,
  },
  behind: {
    position: 'absolute',
    top: 8,
    height: 340,
    borderRadius: 34,
  },
  behindDark: {
    left: 22,
    right: 22,
    backgroundColor: colors.charcoal,
    transform: [{ rotate: '-6deg' }],
  },
  behindAccent: {
    left: 14,
    right: 14,
    top: 10,
    backgroundColor: colors.accent,
    transform: [{ rotate: '4deg' }],
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 18,
    height: 350,
    borderRadius: 34,
    backgroundColor: colors.white,
    padding: 24,
    justifyContent: 'space-between',
    boxShadow: '0 20px 40px rgba(20,20,20,0.12)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  since: {
    backgroundColor: colors.canvas,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sinceText: {
    fontFamily: fonts.semibold,
    color: colors.inkSoft,
  },
  amount: {
    marginTop: 10,
  },
  note: {
    marginTop: 12,
    color: colors.inkSoft,
  },
  actions: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 26,
  },
  action: {
    alignItems: 'center',
    gap: 8,
  },
  round: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  doneTitle: {
    textAlign: 'center',
  },
  doneText: {
    textAlign: 'center',
    maxWidth: 300,
  },
  doneButton: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
});
