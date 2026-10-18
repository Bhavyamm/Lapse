import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { colors, fonts, radii } from '@/theme';
import { selection } from '@/utils/haptics';
import { animateLayout, prefersReducedMotion, SETTLE } from '@/utils/motion';

type Props<T extends string> = {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

type Spot = { x: number; width: number };

/** White pill with a black thumb that slides to the chosen option, as in the All subscriptions sort. */
export function Segmented<T extends string>({ label, options, value, onChange }: Props<T>) {
  const [spots, setSpots] = useState<Partial<Record<T, Spot>>>({});
  const [x] = useState(() => new Animated.Value(0));
  const [width] = useState(() => new Animated.Value(0));
  const placed = useRef(false);
  const target = spots[value];

  useEffect(() => {
    if (!target) return;
    // The first placement jumps; later changes slide.
    if (!placed.current || prefersReducedMotion()) {
      placed.current = true;
      x.setValue(target.x);
      width.setValue(target.width);
      return;
    }
    const slide = Animated.parallel([
      Animated.spring(x, { toValue: target.x, ...SETTLE, useNativeDriver: false }),
      Animated.spring(width, { toValue: target.width, ...SETTLE, useNativeDriver: false }),
    ]);
    slide.start();
    return () => slide.stop();
  }, [target, x, width]);

  return (
    <View style={styles.track} role="radiogroup" aria-label={label}>
      {target ? <Animated.View style={[styles.thumb, { left: x, width }]} /> : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            role="radio"
            aria-checked={selected}
            onPress={() => {
              if (selected) return;
              selection();
              // The list below reorders with the thumb instead of jumping.
              animateLayout();
              onChange(option.value);
            }}
            onLayout={(e) => {
              const { x: left, width: w } = e.nativeEvent.layout;
              setSpots((s) => ({ ...s, [option.value]: { x: left, width: w } }));
            }}
            hitSlop={{ top: 4, bottom: 4 }}
            style={[styles.option, selected && !target && styles.selected]}>
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
  thumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
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
