import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { CheckIcon } from '@/components/icons';
import { colors, fonts, radii } from '@/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Small pill choice. The selected one turns black with an orange check. */
export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      role="radio"
      aria-checked={selected}
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : styles.idle]}>
      {selected ? <CheckIcon color={colors.accent} /> : null}
      <AppText variant="caption" style={[styles.label, { color: selected ? colors.white : colors.ink }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 34,
    borderRadius: radii.pill,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idle: {
    backgroundColor: colors.white,
  },
  selected: {
    backgroundColor: colors.ink,
  },
  label: {
    fontFamily: fonts.semibold,
  },
});
