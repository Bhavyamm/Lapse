import { Pressable, StyleSheet } from 'react-native';

import { PlusIcon } from '@/components/icons';
import { openAdd } from '@/features/pro/limit';
import { colors, radii } from '@/theme';

/** The round black + in screen headers that opens Add a subscription (or Pro once the free plan is full). */
export function AddButton() {
  return (
    <Pressable role="button" aria-label="Add a subscription" onPress={openAdd} style={styles.button}>
      <PlusIcon color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
