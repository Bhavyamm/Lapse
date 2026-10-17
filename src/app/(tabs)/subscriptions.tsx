import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AddButton } from '@/components/add-button';
import { AppText } from '@/components/app-text';
import { GlassCard } from '@/components/cards';
import { PlusIcon } from '@/components/icons';
import { PillButton } from '@/components/pill-button';
import { ScreenHeader } from '@/components/screen-header';
import { Segmented } from '@/components/segmented';
import { SubscriptionRow } from '@/components/subscription-row';
import { TabScreen } from '@/components/tab-screen';
import { useToday } from '@/hooks/use-today';
import { formatMoney } from '@/features/subscriptions/billing';
import {
  buildOverview,
  SORT_OPTIONS,
  sortForList,
  type SortKey,
  type Upcoming,
} from '@/features/subscriptions/overview';
import type { BillingCycle } from '@/features/subscriptions/types';
import { useSubscriptions } from '@/stores/subscriptions';
import { colors, fonts, radii, spacing } from '@/theme';
import { formatMonthDay } from '@/utils/dates';

const CYCLE_WORD: Record<BillingCycle, string> = { week: 'a week', month: 'a month', year: 'a year' };

/** Every subscription: running trials on top, the rest sorted by next renewal, price or name. */
export default function SubscriptionsScreen() {
  const subscriptions = useSubscriptions((s) => s.subscriptions);
  const today = useToday();
  const [sort, setSort] = useState<SortKey>('next');
  const overview = useMemo(() => buildOverview(subscriptions, today), [subscriptions, today]);
  const { trials, rest } = useMemo(() => sortForList(overview.all, sort), [overview, sort]);
  const empty = subscriptions.length === 0;

  return (
    <TabScreen>
      <ScreenHeader
        eyebrow={empty ? undefined : `${overview.tracked} tracked · ${formatMoney(overview.monthlyCents)} a month`}
        title="All subscriptions"
        right={empty ? null : <AddButton />}
      />
      {empty ? (
        <GlassCard contentStyle={styles.empty}>
          <AppText variant="section">Nothing tracked yet</AppText>
          <AppText variant="caption" muted>
            Add what you pay for and it shows up here, sorted by the next charge.
          </AppText>
          <PillButton
            label="Add a subscription"
            icon={<PlusIcon color={colors.white} size={18} />}
            onPress={() => router.push('/add')}
            style={styles.emptyButton}
          />
        </GlassCard>
      ) : (
        <>
          <Segmented label="Sort by" options={SORT_OPTIONS} value={sort} onChange={setSort} />
          {trials.map((u) => (
            <TrialRow key={u.sub.id} item={u} />
          ))}
          {rest.length > 0 ? (
            <GlassCard contentStyle={styles.list}>
              {rest.map((u, i) => (
                <SubscriptionRow key={u.sub.id} sub={u.sub} date={formatMonthDay(u.next)} divider={i > 0} />
              ))}
            </GlassCard>
          ) : null}
        </>
      )}
    </TabScreen>
  );
}

/** Orange card for a running free trial: nothing to pay until it ends. */
function TrialRow({ item }: { item: Upcoming }) {
  const { sub, next } = item;
  return (
    <View style={styles.trial}>
      <View style={styles.trialText}>
        <AppText variant="bodyStrong" style={styles.bold} numberOfLines={1}>
          {sub.name}
        </AppText>
        <AppText variant="caption" style={styles.trialDetail}>
          Free trial · then {formatMoney(sub.priceCents)} {CYCLE_WORD[sub.cycle]}
        </AppText>
      </View>
      <View style={styles.trialRight}>
        <AppText variant="bodyStrong" style={styles.bold}>
          $0
        </AppText>
        <AppText variant="caption" style={styles.trialDetail}>
          Ends {formatMonthDay(next)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: spacing.xl,
    gap: spacing.xs,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  trial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 14,
    borderRadius: radii.row,
    backgroundColor: colors.accent,
  },
  trialText: {
    flex: 1,
  },
  trialRight: {
    alignItems: 'flex-end',
  },
  bold: {
    fontFamily: fonts.bold,
  },
  trialDetail: {
    color: colors.ink,
    fontFamily: fonts.medium,
  },
});
