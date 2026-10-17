import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { radii } from '@/theme';

type CardProps = ViewProps & {
  radius?: number;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Clear Liquid Glass card: light blur over the orange blobs, a diagonal
 * white sheen, and a bright rim on the top-left edge.
 */
export function GlassCard({ radius = radii.card, style, contentStyle, children, ...rest }: CardProps) {
  return (
    <View style={[styles.glassShadow, { borderRadius: radius }, style]} {...rest}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        <BlurView intensity={18} tint="light" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0.30)']}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View pointerEvents="none" style={[styles.glassRim, { borderRadius: radius }]} />
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

/** Nearly solid charcoal card with a subtle rim. Used for hero cards and the nav. */
export function CharcoalCard({ radius = radii.hero, style, contentStyle, children, ...rest }: CardProps) {
  return (
    <View style={[styles.charcoalShadow, { borderRadius: radius }, style]} {...rest}>
      <LinearGradient
        colors={['rgba(48,48,48,0.97)', 'rgba(22,22,22,0.96)', 'rgba(36,36,36,0.97)']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View pointerEvents="none" style={[styles.charcoalRim, { borderRadius: radius }]} />
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  glassShadow: {
    boxShadow: '0 10px 30px rgba(20,20,20,0.10)',
  },
  glassRim: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.95)',
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderRightColor: 'rgba(255,255,255,0.55)',
    borderBottomColor: 'rgba(255,255,255,0.55)',
  },
  charcoalShadow: {
    boxShadow: '0 14px 30px rgba(20,20,20,0.24)',
  },
  charcoalRim: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.22)',
    borderLeftColor: 'rgba(255,255,255,0.22)',
    borderRightColor: 'rgba(255,255,255,0.06)',
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
});
