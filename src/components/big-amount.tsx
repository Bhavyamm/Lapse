import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/app-text';
import { formatMoney } from '@/features/subscriptions/billing';

/** "$74.46" on a charcoal card: a big dollar figure with a smaller "$" and cents. */
type Props = {
  cents: number;
  /** Words after the amount, such as "a month". */
  suffix?: string;
  style?: StyleProp<ViewStyle>;
};

export function BigAmount({ cents, suffix, style }: Props) {
  const [dollars, rest] = formatMoney(cents).slice(1).split('.');
  return (
    <View style={[styles.amount, style]} accessible aria-label={`$${dollars}.${rest}${suffix ? ` ${suffix}` : ''}`}>
      <AppText variant="amountUnit" onDark muted style={styles.symbol}>
        $
      </AppText>
      <AppText variant="display" onDark>
        {dollars}
      </AppText>
      <AppText variant="amountUnit" onDark muted>
        .{rest}
      </AppText>
      {suffix ? (
        <AppText variant="label" onDark muted style={styles.suffix}>
          {suffix}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  symbol: {
    marginRight: 3,
  },
  suffix: {
    marginLeft: 8,
  },
});
