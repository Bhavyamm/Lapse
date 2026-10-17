import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { PlusIcon } from '@/components/icons';
import { colors, radii } from '@/theme';

/** The round black + in screen headers that opens Add a subscription. */
export function AddButton() {
  return (
    <Pressable role="button" aria-label="Add a subscription" onPress={() => router.push('/add')} style={styles.button}>
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
