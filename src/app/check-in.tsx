import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { BigAmount } from '@/components/big-amount';
import { CharcoalCard, GlassCard } from '@/components/cards';
import { Confetti } from '@/components/confetti';
import { FadeFooter } from '@/components/fade-footer';
import { CheckIcon, ClockIcon, CloseIcon } from '@/components/icons';
import { Mascot } from '@/components/mascot';
import { PressScale } from '@/components/press-scale';
import { ScreenBackground } from '@/components/screen-background';
import { ServiceLogo } from '@/components/service-logo';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useToday } from '@/hooks/use-today';
import { describePrice, formatMoney, yearlyCents } from '@/features/subscriptions/billing';
import { addedOn, checkInQueue } from '@/features/subscriptions/check-in';
import { openDetail } from '@/features/subscriptions/open';
import { summarizeSavings } from '@/features/subscriptions/savings';
import type { CancelledSubscription, Subscription } from '@/features/subscriptions/types';
import { useSubscriptions } from '@/stores/subscriptions';
import { colors, fonts, radii, spacing } from '@/theme';
import { formatMonthDay } from '@/utils/dates';

type Outcome = 'kept' | 'later';
/** Keep swipes the card off to the right, Next month to the left. */
type Leaving = { sub: Subscription; outcome: Outcome; key: number };

const SWIPE_MS = 320;
/** Space under the buttons, above the home indicator. */
const SCREEN_BOTTOM = 24;
/** Done and its fade, so the last row can scroll clear of it. */
const DONE_ROOM = 96;

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
  const [leaving, setLeaving] = useState<Leaving | null>(null);
  // Set at once on a tap, so a second tap in the same frame sees it too.
  const swiping = useRef(false);
  const reduceMotion = useReduceMotion();

  const byId = useMemo(() => new Map(subscriptions.map((s) => [s.id, s])), [subscriptions]);
  const cancelledList = useSubscriptions((s) => s.cancelled);
  // One that is gone without an answer was cancelled from its detail screen.
  const current = ids.find((id) => !outcomes[id] && byId.has(id));
  const sub = current ? byId.get(current) : undefined;

  const answer = (outcome: Outcome) => {
    // A tap while a card is still swiping away waits for it, so each answer gets its own swipe.
    if (!sub || swiping.current) return;
    const next = ids.find((id) => id !== sub.id && !outcomes[id] && byId.has(id));
    const nextSub = next ? byId.get(next) : undefined;
    AccessibilityInfo.announceForAccessibility(
      `${outcome === 'kept' ? 'Kept' : 'Next month for'} ${sub.name}. ${nextSub ? `Next: ${nextSub.name}` : 'All checked'}`,
    );
    // The card that swipes away shows the subscription as it was, before this answer.
    if (!reduceMotion) {
      swiping.current = true;
      setLeaving((l) => ({ sub, outcome, key: (l?.key ?? 0) + 1 }));
    }
    update(sub.id, outcome === 'kept' ? { reviewedOn: today } : { skippedOn: today });
    setOutcomes((o) => ({ ...o, [sub.id]: outcome }));
  };
  const finished = !sub && !leaving;

  return (
    <ScreenBackground
      style={[styles.screen, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + SCREEN_BOTTOM }]}>
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
      {!finished ? (
        <>
          <AppText variant="hero" role="heading">
            Still using this?
          </AppText>
          <View style={styles.stack}>
            {sub ? <View style={[styles.behind, styles.behindDark]} /> : null}
            {sub ? <View style={[styles.behind, styles.behindAccent]} /> : null}
            {sub ? (
              <RisingCard key={sub.id} animate={!reduceMotion}>
                <ReviewCard sub={sub} />
              </RisingCard>
            ) : null}
            {leaving ? (
              <SwipingCard
                key={leaving.key}
                outcome={leaving.outcome}
                onDone={() => {
                  swiping.current = false;
                  setLeaving((l) => (l?.key === leaving.key ? null : l));
                }}>
                <ReviewCard sub={leaving.sub} />
              </SwipingCard>
            ) : null}
          </View>
          {sub ? (
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
          ) : null}
        </>
      ) : (
        <Finished
          ids={ids}
          outcomes={outcomes}
          subscriptions={byId}
          cancelled={cancelledList.filter((c) => ids.includes(c.id))}
          animate={!reduceMotion}
        />
      )}
    </ScreenBackground>
  );
}

/** The next card rising from the stack into place. */
function RisingCard({ animate, children }: { animate: boolean; children: ReactNode }) {
  const [progress] = useState(() => new Animated.Value(animate ? 0 : 1));
  useEffect(() => {
    // Reduce Motion can answer after the first card mounted; it then jumps into place.
    if (!animate) return progress.setValue(1);
    Animated.spring(progress, { toValue: 1, delay: 90, speed: 14, bounciness: 6, useNativeDriver: true }).start();
  }, [progress, animate]);
  const style = {
    opacity: progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
    ],
  };
  return <Animated.View style={[styles.cardSlot, style]}>{children}</Animated.View>;
}

/** The answered card flying off: right for Keep it, left for Next month. */
function SwipingCard({ outcome, onDone, children }: { outcome: Outcome; onDone: () => void; children: ReactNode }) {
  const [progress] = useState(() => new Animated.Value(0));
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    const swipe = Animated.timing(progress, {
      toValue: 1,
      duration: SWIPE_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    swipe.start(() => done.current());
    return () => swipe.stop();
  }, [progress]);
  const side = outcome === 'kept' ? 1 : -1;
  const style = {
    opacity: progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
    transform: [
      { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, side * 520] }) },
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
      { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${side * 16}deg`] }) },
    ],
  };
  return (
    <Animated.View
      testID="leaving-card"
      style={[styles.cardSlot, style]}
      pointerEvents="none"
      aria-hidden
      importantForAccessibility="no-hide-descendants">
      {children}
    </Animated.View>
  );
}

/** The white card for one subscription. The stack behind it is drawn by the screen. */
function ReviewCard({ sub }: { sub: Subscription }) {
  const today = useToday();
  const cancelled = useSubscriptions((s) => s.cancelled);
  const saved = useMemo(() => summarizeSavings(cancelled, today).savedCents, [cancelled, today]);
  const yearly = yearlyCents(sub.priceCents, sub.cycle);
  const since = sub.reviewedOn
    ? `Last reviewed ${formatMonthDay(sub.reviewedOn)}`
    : `Added ${formatMonthDay(addedOn(sub))}`;
  return (
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
    <PressScale role="button" aria-label={label} accessibilityHint={hint} onPress={onPress} style={[styles.action]}>
      <View style={[styles.round, { width: size, height: size, backgroundColor: color }]}>{icon}</View>
      <AppText variant="caption" style={styles.bold}>
        {label}
      </AppText>
    </PressScale>
  );
}

type FinishedProps = {
  ids: string[];
  outcomes: Record<string, Outcome>;
  /** Subscriptions still tracked, by id. */
  subscriptions: Map<string, Subscription>;
  /** Those from this check-in that were cancelled from their detail screen. */
  cancelled: CancelledSubscription[];
  animate: boolean;
};

type Row = {
  id: string;
  name: string;
  serviceId: string | null;
  yearly: number;
  result: 'Kept' | 'Cancelled' | 'Next month';
};

function Finished({ ids, outcomes, subscriptions, cancelled, animate }: FinishedProps) {
  // The footer reaches the bottom edge, under the screen's own bottom padding.
  const bottom = useSafeAreaInsets().bottom + SCREEN_BOTTOM;
  const rows = ids.flatMap((id): Row[] => {
    const tracked = subscriptions.get(id);
    // One gone from the list was cancelled from its detail screen, or deleted (nothing to show).
    const item = tracked ?? cancelled.find((c) => c.id === id);
    if (!item) return [];
    const result = !tracked ? 'Cancelled' : outcomes[id] === 'kept' ? 'Kept' : 'Next month';
    const yearly = yearlyCents(item.priceCents, item.cycle);
    return [{ id, name: item.name, serviceId: item.serviceId, yearly, result }];
  });
  const count = (result: Row['result']) => rows.filter((r) => r.result === result).length;
  const kept = count('Kept');
  const cancelledCount = count('Cancelled');
  const later = count('Next month');
  const parts = [
    kept ? `kept ${kept}` : null,
    cancelledCount ? `cancelled ${cancelledCount}` : null,
    later ? `left ${later} for next month` : null,
  ].filter((part): part is string => !!part);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];
  const summary = list ? `You ${list}.` : 'Add a subscription and it shows up here next month.';
  const sum = (result: Row['result']) =>
    rows.filter((r) => r.result === result).reduce((total, r) => total + r.yearly, 0);
  const saving = sum('Cancelled');
  const total = saving || sum('Kept');

  return (
    <View style={[styles.finished, { marginBottom: -bottom }]}>
      <ScrollView
        contentContainerStyle={[styles.doneContent, { paddingBottom: bottom + DONE_ROOM }]}
        showsVerticalScrollIndicator={false}>
        {rows.length ? <Celebrate animate={animate} /> : <Mascot size={118} />}
        <AppText variant="hero" role="heading" style={[styles.center, !rows.length && styles.quietTitle]}>
          {rows.length ? 'All checked' : 'Nothing to check'}
        </AppText>
        <AppText variant="lede" muted style={[styles.center, styles.doneText]}>
          {summary} See you next month.
        </AppText>

        {rows.length ? (
          <CharcoalCard radius={radii.hero} contentStyle={styles.summary}>
            {total ? (
              <View>
                <AppText variant="caption" onDark muted>
                  {saving ? 'You’ll save' : 'Still worth it'}
                </AppText>
                <BigAmount cents={total} suffix="a year" />
                <AppText variant="caption" onDark muted>
                  {saving
                    ? `By cancelling ${cancelledCount === 1 ? 'one subscription' : `${cancelledCount} subscriptions`}`
                    : `On the ${kept === 1 ? 'one' : kept} you kept`}
                </AppText>
              </View>
            ) : null}
            <View style={styles.tally}>
              <Tally value={kept} label="Kept" accent />
              <Tally value={cancelledCount} label="Cancelled" />
              <Tally value={later} label="Next month" />
            </View>
          </CharcoalCard>
        ) : null}

        {rows.length ? (
          <GlassCard radius={radii.card} contentStyle={styles.rows}>
            {rows.map((row) => (
              <View
                key={row.id}
                style={styles.row}
                accessible
                aria-label={`${row.name}, ${formatMoney(row.yearly)} a year. ${row.result}`}>
                <ServiceLogo serviceId={row.serviceId} name={row.name} size={36} />
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {row.name}
                  </AppText>
                  <AppText variant="caption" muted>
                    {formatMoney(row.yearly)} a year
                  </AppText>
                </View>
                <View style={[styles.result, RESULT_STYLE[row.result]]}>
                  <AppText
                    variant="caption"
                    style={[styles.bold, row.result === 'Cancelled' && { color: colors.white }]}>
                    {row.result}
                  </AppText>
                </View>
              </View>
            ))}
          </GlassCard>
        ) : null}
      </ScrollView>
      <FadeFooter style={[styles.doneFooter, { paddingBottom: bottom }]}>
        <PressScale role="button" onPress={leave} style={styles.doneButton}>
          <AppText variant="button" onDark>
            Done
          </AppText>
        </PressScale>
      </FadeFooter>
    </View>
  );
}

const RESULT_STYLE = {
  Kept: { backgroundColor: colors.accent },
  Cancelled: { backgroundColor: colors.ink },
  'Next month': { backgroundColor: colors.white },
} as const;

function Tally({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <View
      style={[styles.tallyItem, accent && value > 0 && styles.tallyAccent]}
      accessible
      aria-label={`${value} ${label}`}>
      <AppText variant="title" onDark={!(accent && value > 0)}>
        {value}
      </AppText>
      <AppText
        variant="caption"
        onDark={!(accent && value > 0)}
        muted={!(accent && value > 0)}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}>
        {label}
      </AppText>
    </View>
  );
}

/** The mascot popping up in a burst of confetti. */
function Celebrate({ animate }: { animate: boolean }) {
  const [pop] = useState(() => new Animated.Value(animate ? 0 : 1));
  useEffect(() => {
    if (!animate) return pop.setValue(1);
    Animated.spring(pop, { toValue: 1, speed: 10, bounciness: 12, useNativeDriver: true }).start();
  }, [pop, animate]);
  const style = {
    opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
    transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
  };
  return (
    <Animated.View style={[styles.celebrate, style]} aria-hidden>
      <Confetti width={300} height={176} />
      <Mascot size={118} />
    </Animated.View>
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
  // Up to the designed 380 pt, shrinking on short phones so the buttons stay on screen.
  stack: {
    flexGrow: 1,
    flexShrink: 1,
    maxHeight: 380,
    minHeight: 300,
    marginTop: 6,
  },
  behind: {
    position: 'absolute',
    top: 8,
    bottom: 32,
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
  cardSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 18,
    bottom: 12,
  },
  card: {
    flex: 1,
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
  finished: {
    flex: 1,
    marginHorizontal: -20,
  },
  doneContent: {
    paddingHorizontal: 20,
    gap: spacing.md,
  },
  center: {
    textAlign: 'center',
  },
  quietTitle: {
    marginTop: spacing.md,
  },
  doneText: {
    alignSelf: 'center',
    maxWidth: 300,
    marginTop: -spacing.xs,
  },
  celebrate: {
    width: 300,
    height: 176,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    padding: 22,
    gap: spacing.lg,
  },
  tally: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tallyItem: {
    flex: 1,
    backgroundColor: colors.onDarkPanel,
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: 14,
  },
  tallyAccent: {
    backgroundColor: colors.accent,
  },
  rows: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
  },
  rowText: {
    flex: 1,
  },
  result: {
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  doneFooter: {
    alignItems: 'center',
  },
  doneButton: {
    minWidth: 140,
    height: 52,
    paddingHorizontal: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
