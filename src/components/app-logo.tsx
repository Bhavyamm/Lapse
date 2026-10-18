import { useId } from 'react';
import { brand, colors } from '@/theme';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

/** The lapse. logo: a glossy orange squircle with a dark card sliced in two. */
export function AppLogo({ size = 116 }: { size?: number }) {
  const p = useId().replace(/:/g, '');
  return (
    <Svg width={size} height={size} viewBox="0 0 116 116">
      <Defs>
        <RadialGradient id={`${p}body`} cx="35%" cy="25%" r="85%">
          <Stop offset="0" stopColor={brand.orangeHighlight} />
          <Stop offset="0.55" stopColor={brand.orange} />
          <Stop offset="1" stopColor={brand.orangeDeep} />
        </RadialGradient>
        <LinearGradient id={`${p}shine`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.white} stopOpacity={0.55} />
          <Stop offset="1" stopColor={colors.white} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id={`${p}card`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={brand.cardLight} />
          <Stop offset="1" stopColor={brand.cardDark} />
        </LinearGradient>
        <ClipPath id={`${p}left`}>
          <Polygon points="0,0 62,0 50,116 0,116" />
        </ClipPath>
        <ClipPath id={`${p}right`}>
          <Polygon points="62,0 116,0 116,116 50,116" />
        </ClipPath>
      </Defs>
      <Rect width={116} height={116} rx={36} fill={`url(#${p}body)`} />
      <Ellipse cx={52} cy={20} rx={40} ry={14} fill={`url(#${p}shine)`} opacity={0.6} />
      <G clipPath={`url(#${p}left)`}>
        <G x={-3} y={1} rotation={-3} origin="40, 58">
          <Rect x={24} y={38} width={68} height={44} rx={10} fill={`url(#${p}card)`} />
          <Rect x={24} y={48} width={68} height={8} fill={brand.orange} opacity={0.9} />
          <Rect x={32} y={66} width={16} height={6} rx={3} fill={colors.white} opacity={0.85} />
        </G>
      </G>
      <G clipPath={`url(#${p}right)`}>
        <G x={4} y={-2} rotation={7} origin="76, 58">
          <Rect x={24} y={38} width={68} height={44} rx={10} fill={`url(#${p}card)`} />
          <Rect x={24} y={48} width={68} height={8} fill={brand.orange} opacity={0.9} />
        </G>
      </G>
    </Svg>
  );
}
