import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { colors, fonts, radii } from '@/theme';

type Props<T extends string> = {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** White pill with a black thumb on the chosen option, as in the All subscriptions sort. */
export function Segmented<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <View style={styles.track} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            role="radio"
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.selected]}>
            <AppText variant="label" style={[styles.text, { color: selected ? colors.white : colors.inkSoft }]}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    padding: 4,
  },
  option: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radii.pill,
  },
  selected: {
    backgroundColor: colors.ink,
  },
  text: {
    fontFamily: fonts.semibold,
  },
});
