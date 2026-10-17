import { useState } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { prefersReducedMotion } from '@/utils/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while held. Big buttons shrink less. */
  scale?: number;
};

/** A Pressable that eases down a little while held and springs back, instead of blinking. */
export function PressScale({ style, scale = 0.96, onPressIn, onPressOut, ...rest }: Props) {
  const [value] = useState(() => new Animated.Value(1));
  const to = (toValue: number) => {
    if (prefersReducedMotion()) return;
    Animated.spring(value, { toValue, damping: 18, stiffness: 320, mass: 0.6, useNativeDriver: true }).start();
  };
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        to(scale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale: value }] }]}
    />
  );
}
