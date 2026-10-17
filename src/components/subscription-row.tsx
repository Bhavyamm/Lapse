import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ServiceLogo } from '@/components/service-logo';
import { formatMoney } from '@/features/subscriptions/billing';
import type { BillingCycle, Subscription } from '@/features/subscriptions/types';
import { colors, spacing } from '@/theme';

const CYCLE_LABEL: Record<BillingCycle, string> = { week: 'Weekly', month: 'Monthly', year: 'Yearly' };

type Props = {
  sub: Subscription;
  /** The next charge, already formatted for this list. */
  date: string;
  trialEnding?: boolean;
  /** Draws the divider above; off for the first row of a card. */
  divider?: boolean;
};

/** One subscription in a glass list: logo, name and cycle, then price and date on the right. */
export function SubscriptionRow({ sub, date, trialEnding, divider = true }: Props) {
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <ServiceLogo serviceId={sub.serviceId} name={sub.name} />
      <View style={styles.text}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {sub.name}
        </AppText>
        <AppText variant="caption" muted>
          {trialEnding ? 'Free trial' : CYCLE_LABEL[sub.cycle]}
        </AppText>
      </View>
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
});
