import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/app-text';
import { findService, logoFor } from '@/features/catalog/catalog';
import { colors, fonts, radii } from '@/theme';

type Props = {
  /** Catalog id; null or unknown shows a monogram of `name`. */
  serviceId: string | null;
  name: string;
  size?: number;
};

/** Relative luminance of a #RRGGBB color, 0 (black) to 1 (white). */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The rounded square brand tile used on every subscription row. */
export function ServiceLogo({ serviceId, name, size = 42 }: Props) {
  const service = findService(serviceId);
  const logo = service ? logoFor(service) : undefined;
  const tile = service?.tile ?? logo?.hex ?? colors.charcoal;
  const glyph = service?.glyph ?? (luminance(tile) > 0.55 ? colors.ink : colors.white);
  const light = luminance(tile) > 0.85;

  return (
    <View
      aria-hidden
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * (radii.icon / 42), backgroundColor: tile },
        light && styles.lightTile,
      ]}>
      {logo ? (
        <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
          <Path d={logo.path} fill={glyph} />
        </Svg>
      ) : (
        <AppText style={[styles.monogram, { color: glyph, fontSize: size * 0.45, lineHeight: size * 0.55 }]}>
          {name.trim().charAt(0).toUpperCase() || '?'}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lightTile: {
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  monogram: {
    fontFamily: fonts.bold,
  },
});
