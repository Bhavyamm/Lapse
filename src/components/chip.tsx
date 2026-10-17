import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { CheckIcon } from '@/components/icons';
import { colors, fonts, radii } from '@/theme';
import { selection } from '@/utils/haptics';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Set when the chip sits on a white surface, so unselected chips stay visible. */
  onWhite?: boolean;
};

/** Small pill choice. The selected one turns black with an orange check. */
export function Chip({ label, selected, onPress, onWhite }: Props) {
  return (
    <Pressable
      role="radio"
      aria-checked={selected}
      onPress={() => {
        if (!selected) selection();
        onPress();
      }}
      hitSlop={{ top: 5, bottom: 5 }}
      style={[styles.chip, selected ? styles.selected : onWhite ? styles.idleOnWhite : styles.idle]}>
      {selected ? <CheckIcon color={colors.accent} /> : null}
      <AppText variant="caption" style={[styles.label, { color: selected ? colors.white : colors.ink }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 34,
    paddingVertical: 6,
    borderRadius: radii.pill,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idle: {
    backgroundColor: colors.white,
  },
  idleOnWhite: {
    backgroundColor: colors.canvas,
  },
  selected: {
    backgroundColor: colors.ink,
  },
  label: {
    fontFamily: fonts.semibold,
  },
});
