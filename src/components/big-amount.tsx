import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/app-text';
import { formatMoney } from '@/features/subscriptions/billing';

/** "$74.46" on a charcoal card: a big dollar figure with a smaller "$" and cents. */
export function BigAmount({ cents, style }: { cents: number; style?: StyleProp<ViewStyle> }) {
  const [dollars, rest] = formatMoney(cents).slice(1).split('.');
  return (
    <View style={[styles.amount, style]} accessible aria-label={`$${dollars}.${rest}`}>
      <AppText variant="amountUnit" onDark muted style={styles.symbol}>
        $
      </AppText>
      <AppText variant="display" onDark>
        {dollars}
      </AppText>
      <AppText variant="amountUnit" onDark muted>
        .{rest}
      </AppText>
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
});
