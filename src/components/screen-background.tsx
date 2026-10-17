import { useId, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewProps } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { brand, colors } from '@/theme';

/**
 * The gray canvas with two soft glows behind every main screen: warm orange
 * at the top right and a faint gray at the bottom left. The glows are what the
 * Liquid Glass cards refract, so keep them behind all content.
 */
export function ScreenBackground({ children, style, onLayout, ...rest }: ViewProps) {
  // Gradient ids must be unique per page on web, where several screens stay mounted.
  const id = useId().replace(/:/g, '');
  // The SVG gets the measured size in points. With width="100%" iOS sizes it to the
  // padded content box, which left hard edges on the right and at the bottom.
  const [size, setSize] = useState({ width: 0, height: 0 });
  const measure = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((old) => (old.width === width && old.height === height ? old : { width, height }));
    onLayout?.(event);
  };
  const { width, height } = size;

  return (
    <View style={[styles.root, style]} onLayout={measure} {...rest}>
      {width > 0 && (
        <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
          <Defs>
            <Glow id={`${id}warm`} cx={width} cy={0} r={width * 0.95} color={brand.orange} opacity={0.5} />
            <Glow id={`${id}cool`} cx={0} cy={height} r={width * 0.9} color={brand.cool} opacity={0.22} />
          </Defs>
          <Rect width={width} height={height} fill={colors.canvas} />
          <Rect width={width} height={height} fill={`url(#${id}warm)`} />
          <Rect width={width} height={height} fill={`url(#${id}cool)`} />
        </Svg>
      )}
      {children}
    </View>
  );
}

type GlowProps = {
  id: string;
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity: number;
};

function Glow({ id, cx, cy, r, color, opacity }: GlowProps) {
  return (
    <RadialGradient id={id} cx={cx} cy={cy} r={r} fx={cx} fy={cy} gradientUnits="userSpaceOnUse">
      <Stop offset="0" stopColor={color} stopOpacity={opacity} />
      <Stop offset="1" stopColor={color} stopOpacity={0} />
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});
