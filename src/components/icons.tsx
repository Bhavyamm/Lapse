import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color: string };

const stroke = (color: string) => ({
  fill: 'none',
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function HomeIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)}>
      <Rect x={3} y={3} width={7.5} height={7.5} rx={2} />
      <Rect x={13.5} y={3} width={7.5} height={7.5} rx={2} />
      <Rect x={3} y={13.5} width={7.5} height={7.5} rx={2} />
      <Rect x={13.5} y={13.5} width={7.5} height={7.5} rx={2} />
    </Svg>
  );
}

export function CalendarIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)}>
      <Rect x={3} y={5} width={18} height={16} rx={3} />
      <Path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

export function ListIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)}>
      <Path d="M9 6h11M9 12h11M9 18h11" />
      <Circle cx={4.5} cy={6} r={1} fill={color} />
      <Circle cx={4.5} cy={12} r={1} fill={color} />
      <Circle cx={4.5} cy={18} r={1} fill={color} />
    </Svg>
  );
}

export function ProfileIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)}>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  );
}

export function PlusIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)} strokeWidth={2.4}>
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function ChevronIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)} strokeWidth={2.6}>
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

export function CloseIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)} strokeWidth={2.4}>
      <Path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function LockIcon({ size = 13, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)} strokeWidth={2.2}>
      <Rect x={5} y={11} width={14} height={10} rx={2.5} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}
