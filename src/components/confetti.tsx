import { StyleSheet } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { brand, colors } from '@/theme';

type Piece = { x: number; y: number; kind: 'bar' | 'dot'; color: string; angle?: number; size?: number };

/** Spots on a 300 × 190 box, kept clear of the middle where the mascot sits. */
const PIECES: Piece[] = [
  { x: 40, y: 38, kind: 'bar', color: colors.accent, angle: -24 },
  { x: 76, y: 14, kind: 'dot', color: colors.charcoal, size: 5 },
  { x: 22, y: 98, kind: 'dot', color: brand.orangeHighlight, size: 7 },
  { x: 58, y: 140, kind: 'bar', color: colors.charcoal, angle: 32 },
  { x: 92, y: 74, kind: 'dot', color: colors.white, size: 6 },
  { x: 30, y: 168, kind: 'dot', color: colors.accent, size: 4 },
  { x: 118, y: 22, kind: 'bar', color: brand.peach, angle: 64 },
  { x: 186, y: 16, kind: 'bar', color: colors.accent, angle: 18 },
  { x: 226, y: 30, kind: 'dot', color: colors.white, size: 7 },
  { x: 262, y: 64, kind: 'bar', color: colors.charcoal, angle: -40 },
  { x: 214, y: 90, kind: 'dot', color: colors.accent, size: 5 },
  { x: 276, y: 126, kind: 'dot', color: brand.orangeHighlight, size: 6 },
  { x: 240, y: 154, kind: 'bar', color: colors.accent, angle: 70 },
  { x: 206, y: 178, kind: 'dot', color: colors.charcoal, size: 4 },
  { x: 150, y: 6, kind: 'dot', color: colors.accent, size: 4 },
];

/** A burst of orange, charcoal and white bits behind a celebration. Decorative only. */
export function Confetti({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 300 190" style={StyleSheet.absoluteFill} aria-hidden>
      {PIECES.map((p, i) =>
        p.kind === 'dot' ? (
          <Circle key={i} cx={p.x} cy={p.y} r={p.size} fill={p.color} />
        ) : (
          <Rect
            key={i}
            x={p.x - 9}
            y={p.y - 3.5}
            width={18}
            height={7}
            rx={3.5}
            fill={p.color}
            transform={`rotate(${p.angle ?? 0} ${p.x} ${p.y})`}
          />
        ),
      )}
    </Svg>
  );
}
