import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';

type Props = {
  /** Small line above the title, such as today's date. */
  eyebrow?: string;
  title: string;
  /** Line under the title, such as a month's total. */
  subtitle?: string;
  right?: ReactNode;
};

export function ScreenHeader({ eyebrow, title, subtitle, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        {eyebrow ? (
          <AppText variant="label" muted>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="title">{title}</AppText>
        {subtitle ? (
          <AppText variant="label" muted>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  text: {
    flexShrink: 1,
  },
});
