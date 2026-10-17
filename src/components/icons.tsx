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

export function BellIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)} strokeWidth={2.2}>
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Svg>
  );
}

export function CheckIcon({ size = 12, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)} strokeWidth={3.6}>
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export function BackIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)} strokeWidth={2.4}>
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)} strokeWidth={2.2}>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M20 20l-3.5-3.5" />
    </Svg>
  );
}

export function PencilIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)} strokeWidth={2.2}>
      <Path d="M12 20h9" />
      <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Svg>
  );
}

export function ArrowRightIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)} strokeWidth={2.4}>
      <Path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}
