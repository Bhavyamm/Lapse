import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * The orange glossy squircle mascot from the designs. The soft highlights
 * use gradients instead of blur filters so it renders the same everywhere.
 */
export function Mascot({ size = 200, shadow = true }: { size?: number; shadow?: boolean }) {
  const p = useId().replace(/:/g, '');
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`${p}mBody`} cx="34%" cy="26%" r="82%">
          <Stop offset="0" stopColor="#FFD2B0" />
          <Stop offset="0.42" stopColor="#F58A4A" />
          <Stop offset="1" stopColor="#C24E18" />
        </RadialGradient>
        <LinearGradient id={`${p}mRim`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.55" stopColor="#9E3A0C" stopOpacity={0} />
          <Stop offset="1" stopColor="#9E3A0C" stopOpacity={0.4} />
        </LinearGradient>
        <RadialGradient id={`${p}mBlush`}>
          <Stop offset="0" stopColor="#FF5E7E" stopOpacity={0.7} />
          <Stop offset="1" stopColor="#FF5E7E" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`${p}mEye`} cx="40%" cy="32%" r="75%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E6E1EE" />
        </RadialGradient>
        <RadialGradient id={`${p}mShine`}>
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.65} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {shadow && <Ellipse cx={100} cy={186} rx={64} ry={10} fill="#000000" opacity={0.35} />}
      <G rotation={-14} origin="30, 60">
        <Ellipse cx={30} cy={62} rx={15} ry={19} fill={`url(#${p}mBody)`} />
        <Ellipse cx={25} cy={54} rx={8} ry={6} fill={`url(#${p}mShine)`} />
      </G>
      <Rect x={26} y={26} width={148} height={148} rx={60} fill={`url(#${p}mBody)`} />
      <Rect x={26} y={26} width={148} height={148} rx={60} fill={`url(#${p}mRim)`} />
      <G rotation={-18} origin="70, 52">
        <Ellipse cx={70} cy={52} rx={38} ry={17} fill={`url(#${p}mShine)`} />
      </G>
      <Ellipse cx={54} cy={120} rx={18} ry={11} fill={`url(#${p}mBlush)`} />
      <Ellipse cx={146} cy={120} rx={18} ry={11} fill={`url(#${p}mBlush)`} />
      <Ellipse cx={76} cy={92} rx={17} ry={20} fill={`url(#${p}mEye)`} />
      <Ellipse cx={124} cy={92} rx={17} ry={20} fill={`url(#${p}mEye)`} />
      <Circle cx={80} cy={87} r={10} fill="#1B1A22" />
      <Circle cx={128} cy={87} r={10} fill="#1B1A22" />
      <Circle cx={84} cy={83} r={3.6} fill="#FFFFFF" />
      <Circle cx={132} cy={83} r={3.6} fill="#FFFFFF" />
      <Path d="M82 118 C86 140 114 140 118 118 C106 123 94 123 82 118 Z" fill="#4A1E0C" />
      <Ellipse cx={100} cy={131} rx={9} ry={4.5} fill="#FF8C98" />
    </Svg>
  );
}
