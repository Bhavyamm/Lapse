import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CharcoalCard, GlassCard } from '@/components/cards';
import { PlusIcon } from '@/components/icons';
import { Mascot } from '@/components/mascot';
import { PillButton } from '@/components/pill-button';
import { ScreenHeader } from '@/components/screen-header';
import { ServiceLogo } from '@/components/service-logo';
import { TabScreen } from '@/components/tab-screen';
import { formatMoney, nextChargeDate } from '@/features/subscriptions/billing';
import type { BillingCycle, Subscription } from '@/features/subscriptions/types';
import { useSubscriptions } from '@/stores/subscriptions';
import { colors, radii, spacing } from '@/theme';
import { formatShortDate, formatToday, today as getToday } from '@/utils/dates';

/** Home: the empty state until something is added, then what's coming up. */
export default function HomeScreen() {
  const subscriptions = useSubscriptions((s) => s.subscriptions);
  const empty = subscriptions.length === 0;
  return (
    <TabScreen>
      <ScreenHeader
        eyebrow={formatToday()}
        title="Your subscriptions"
        right={
          empty ? null : (
            <Pressable
              role="button"
              aria-label="Add a subscription"
              onPress={() => router.push('/add')}
              style={styles.add}>
              <PlusIcon color={colors.white} />
            </Pressable>
          )
        }
      />
      {empty ? <EmptyHome /> : <ComingUp subscriptions={subscriptions} />}
    </TabScreen>
  );
}

const CYCLE_LABEL: Record<BillingCycle, string> = { week: 'Weekly', month: 'Monthly', year: 'Yearly' };

/** Every subscription, soonest charge first. The spend card and alerts join it in the next step. */
function ComingUp({ subscriptions }: { subscriptions: Subscription[] }) {
  const today = getToday();
  const rows = subscriptions
    .map((sub) => ({ sub, next: nextChargeDate(sub, today) }))
    .sort((a, b) => a.next.localeCompare(b.next) || a.sub.name.localeCompare(b.sub.name));
  return (
    <GlassCard contentStyle={styles.list}>
      <AppText variant="section" style={styles.listTitle}>
        Coming up
      </AppText>
      {rows.map(({ sub, next }) => {
        const trialing = sub.trial && next === sub.chargeOn;
        return (
          <View key={sub.id} style={styles.row}>
            <ServiceLogo serviceId={sub.serviceId} name={sub.name} />
            <View style={styles.rowText}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {sub.name}
              </AppText>
              <AppText variant="caption" muted>
                {trialing ? 'Free trial ends' : CYCLE_LABEL[sub.cycle]}
              </AppText>
            </View>
            <View style={styles.rowRight}>
              <AppText variant="bodyStrong">{formatMoney(sub.priceCents)}</AppText>
              <AppText variant="caption" muted>
                {formatShortDate(next)}
              </AppText>
            </View>
          </View>
        );
      })}
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
  add: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 4,
  },
  listTitle: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  rowText: {
    flex: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
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
