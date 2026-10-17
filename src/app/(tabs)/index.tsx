import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AddButton } from '@/components/add-button';
import { AppText } from '@/components/app-text';
import { BigAmount } from '@/components/big-amount';
import { CharcoalCard, GlassCard } from '@/components/cards';
import { ChevronIcon, PlusIcon } from '@/components/icons';
import { Mascot } from '@/components/mascot';
import { PillButton } from '@/components/pill-button';
import { ScreenHeader } from '@/components/screen-header';
import { ServiceLogo } from '@/components/service-logo';
import { SubscriptionRow } from '@/components/subscription-row';
import { TabScreen } from '@/components/tab-screen';
import { formatMoney } from '@/features/subscriptions/billing';
import { buildOverview, inDays, whenShort, type TrialAlert, type Upcoming } from '@/features/subscriptions/overview';
import type { BillingCycle, Subscription } from '@/features/subscriptions/types';
import { useSubscriptions } from '@/stores/subscriptions';
import { colors, fonts, radii, spacing } from '@/theme';
import { useToday } from '@/hooks/use-today';
import { formatShortDate, formatToday, fromLocalDate, type LocalDate } from '@/utils/dates';

/** Home: the empty state until something is added, then spending, alerts and what's next. */
export default function HomeScreen() {
  const subscriptions = useSubscriptions((s) => s.subscriptions);
  const today = useToday();
  const empty = subscriptions.length === 0;
  return (
    <TabScreen>
      <ScreenHeader
        eyebrow={formatToday(fromLocalDate(today))}
        title="Your subscriptions"
        right={empty ? null : <AddButton />}
      />
      {empty ? <EmptyHome /> : <Dashboard subscriptions={subscriptions} />}
    </TabScreen>
  );
}

const CYCLE_WORD: Record<BillingCycle, string> = { week: 'a week', month: 'a month', year: 'a year' };

function Dashboard({ subscriptions }: { subscriptions: Subscription[] }) {
  const today = useToday();
  const overview = useMemo(() => buildOverview(subscriptions, today), [subscriptions, today]);
  return (
    <>
      <SpendCard monthlyCents={overview.monthlyCents} yearlyCents={overview.yearlyCents} count={overview.count} />
      {overview.attention.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <View style={styles.dot} />
            <AppText variant="section">Needs your attention</AppText>
          </View>
          {overview.attention.map((alert) => (
            <TrialCard key={alert.sub.id} alert={alert} today={today} />
          ))}
        </View>
      ) : null}
      {overview.upcoming.length > 0 ? <ComingUp rows={overview.upcoming} /> : null}
    </>
  );
}

/** Charcoal card with the monthly total, as "$74.46" with a big dollar figure. */
function SpendCard({ monthlyCents, yearlyCents, count }: { monthlyCents: number; yearlyCents: number; count: number }) {
  const yearly = formatMoney(Math.round(yearlyCents / 100) * 100).slice(0, -3);
  const across =
    count === 0
      ? 'Nothing charged yet, only free trials'
      : `${yearly} a year across ${count} ${count === 1 ? 'subscription' : 'subscriptions'}`;
  return (
    <CharcoalCard contentStyle={styles.spend}>
      <AppText variant="label" onDark muted>
        Spending this month
      </AppText>
      <BigAmount cents={monthlyCents} style={styles.amount} />
      <AppText variant="label" onDark muted>
        {across}
      </AppText>
    </CharcoalCard>
  );
}

/** Orange row for a free trial that is about to turn into a charge. */
function TrialCard({ alert, today }: { alert: TrialAlert; today: LocalDate }) {
  const { sub, endsOn, daysLeft } = alert;
  const when = whenShort(endsOn, today);
  return (
    <View style={styles.trial}>
      <ServiceLogo serviceId={sub.serviceId} name={sub.name} size={44} />
      <View style={styles.rowText}>
        <AppText variant="bodyStrong" style={styles.trialTitle}>
          {sub.name} trial ends {inDays(daysLeft)}
        </AppText>
        <AppText variant="caption" style={styles.trialDetail}>
          Then {formatMoney(sub.priceCents)} {CYCLE_WORD[sub.cycle]} from {when}
        </AppText>
      </View>
      <View style={styles.trialArrow}>
        <ChevronIcon color={colors.white} />
      </View>
    </View>
  );
}

/** The next few charges, soonest first, with a link to the full list. */
function ComingUp({ rows }: { rows: Upcoming[] }) {
  return (
    <GlassCard contentStyle={styles.list}>
      <View style={styles.listHeader}>
        <AppText variant="section">Coming up</AppText>
        <Pressable
          role="link"
          aria-label="See all subscriptions"
          onPress={() => router.navigate('/subscriptions')}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <AppText variant="caption" muted style={styles.seeAll}>
            See all
          </AppText>
        </Pressable>
      </View>
      {rows.map(({ sub, next, trialEnding }) => (
        <SubscriptionRow key={sub.id} sub={sub} date={formatShortDate(next)} trialEnding={trialEnding} />
      ))}
    </GlassCard>
  );
}

function EmptyHome() {
  return (
    <CharcoalCard radius={radii.large} contentStyle={styles.card}>
      <View>
        <View style={styles.bubbleAnchor}>
          <View style={styles.bubble}>
            <AppText variant="label" style={styles.bubbleText}>
              Nothing here yet!
            </AppText>
          </View>
        </View>
        <Mascot size={200} />
      </View>
      <AppText variant="headline" onDark style={styles.center}>
        What do you pay for?
      </AppText>
      <AppText onDark muted style={[styles.center, styles.lede]}>
        Add one subscription and we’ll remind you before it charges.
      </AppText>
      <PillButton
        label="Add your first one"
        icon={<PlusIcon color={colors.white} size={18} />}
        onPress={() => router.push('/add')}
        style={styles.cta}
      />
    </CharcoalCard>
  );
}

const styles = StyleSheet.create({
  spend: {
    paddingVertical: 20,
    paddingHorizontal: spacing.xl,
  },
  amount: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  trial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 14,
    borderRadius: radii.row,
    backgroundColor: colors.accent,
  },
  trialTitle: {
    fontFamily: fonts.bold,
  },
  trialDetail: {
    color: colors.ink,
    fontFamily: fonts.medium,
  },
  trialArrow: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  seeAll: {
    fontFamily: fonts.medium,
  },
  rowText: {
    flex: 1,
  },
  card: {
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  bubbleAnchor: {
    position: 'absolute',
    left: 128,
    top: -22,
    width: 200,
    zIndex: 1,
  },
  bubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 13,
    boxShadow: '0 10px 24px rgba(0,0,0,0.3)',
  },
  bubbleText: {
    fontFamily: 'BricolageGrotesque_600SemiBold',
  },
  center: {
    textAlign: 'center',
  },
  lede: {
    marginTop: 10,
    maxWidth: 280,
  },
  cta: {
    marginTop: spacing.xxl,
    alignSelf: 'stretch',
  },
});
