import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ServiceLogo } from '@/components/service-logo';
import { formatMoney } from '@/features/subscriptions/billing';
import type { BillingCycle, Subscription } from '@/features/subscriptions/types';
import { colors, fonts, radii, spacing } from '@/theme';

const CYCLE_LABEL: Record<BillingCycle, string> = { week: 'Weekly', month: 'Monthly', year: 'Yearly' };

type Props = {
  sub: Subscription;
  /** The next charge, already formatted for this list. */
  date: string;
  trialEnding?: boolean;
  /** Draws the divider above; off for the first row of a card. */
  divider?: boolean;
  /** One line: the name with a "Trial ends" tag, no cycle line. For lists already grouped by date. */
  compact?: boolean;
};

/** One subscription in a glass list: logo, name and cycle, then price and date on the right. */
export function SubscriptionRow({ sub, date, trialEnding, divider = true, compact = false }: Props) {
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <ServiceLogo serviceId={sub.serviceId} name={sub.name} />
      {compact ? (
        <View style={[styles.text, styles.line]}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.shrink}>
            {sub.name}
          </AppText>
          {trialEnding ? (
            <View style={styles.tag}>
              <AppText variant="caption" style={styles.tagText}>
                Trial ends
              </AppText>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.text}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {sub.name}
          </AppText>
          <AppText variant="caption" muted>
            {trialEnding ? 'Free trial' : CYCLE_LABEL[sub.cycle]}
          </AppText>
        </View>
      )}
      <View style={styles.right}>
        <AppText variant="bodyStrong">{formatMoney(sub.priceCents)}</AppText>
        <AppText variant="caption" muted>
          {date}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  text: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shrink: {
    flexShrink: 1,
  },
  tag: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    color: colors.ink,
    fontFamily: fonts.bold,
  },
});
