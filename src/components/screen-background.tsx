import { useId } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme';

/**
 * The gray canvas with soft orange blobs behind every main screen. The blobs
 * are what the Liquid Glass cards refract, so keep them behind all content.
 */
export function ScreenBackground({ children, style, ...rest }: ViewProps) {
  // Gradient ids must be unique per page on web, where several screens stay mounted.
  const id = useId().replace(/:/g, '');
  return (
    <View style={[styles.root, style]} {...rest}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <Blob id={`${id}b1`} cx="92%" cy="6%" rx="45%" ry="26%" color="#EE7A3A" opacity={0.85} />
          <Blob id={`${id}b2`} cx="4%" cy="40%" rx="40%" ry="22%" color="#FFAA6E" opacity={0.7} />
          <Blob id={`${id}b3`} cx="96%" cy="72%" rx="45%" ry="24%" color="#EE7A3A" opacity={0.55} />
          <Blob id={`${id}b4`} cx="10%" cy="98%" rx="50%" ry="26%" color="#6E6E7D" opacity={0.4} />
        </Defs>
        <Rect width="100%" height="100%" fill={colors.canvas} />
        <Rect width="100%" height="100%" fill={`url(#${id}b1)`} />
        <Rect width="100%" height="100%" fill={`url(#${id}b2)`} />
        <Rect width="100%" height="100%" fill={`url(#${id}b3)`} />
        <Rect width="100%" height="100%" fill={`url(#${id}b4)`} />
      </Svg>
      {children}
    </View>
  );
}

type BlobProps = {
  id: string;
  cx: string;
  cy: string;
  rx: string;
  ry: string;
  color: string;
  opacity: number;
};

function Blob({ id, cx, cy, rx, ry, color, opacity }: BlobProps) {
  return (
    <RadialGradient id={id} cx={cx} cy={cy} rx={rx} ry={ry} fx={cx} fy={cy} gradientUnits="userSpaceOnUse">
      <Stop offset="0" stopColor={color} stopOpacity={opacity} />
      <Stop offset="0.72" stopColor={color} stopOpacity={0} />
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});
