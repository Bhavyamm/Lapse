import { useEffect, useState, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import { prefersReducedMotion, SETTLE } from '@/utils/motion';

type Props = {
  /** Where it starts from, in points, before settling into place. */
  x?: number;
  y?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Fades and settles its content into place when it mounts. Key it to replay on a change. */
export function Appear({ x = 0, y = 0, style, children }: Props) {
  const [progress] = useState(() => new Animated.Value(prefersReducedMotion() ? 1 : 0));
  useEffect(() => {
    const settle = Animated.spring(progress, { toValue: 1, ...SETTLE, useNativeDriver: true });
    settle.start();
    return () => settle.stop();
  }, [progress]);
  const motion = {
    // From part-way, so quick repeated changes never blank the content.
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [
      { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [x, 0] }) },
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) },
    ],
  };
  return <Animated.View style={[style, motion]}>{children}</Animated.View>;
}
