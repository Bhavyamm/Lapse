/**
 * Design tokens for the "Bold style · charcoal and orange" theme.
 * Values come from the final screen designs (Bricolage Grotesque, gray canvas,
 * charcoal cards, orange accent, Liquid Glass cards).
 */

export const colors = {
  canvas: '#E6E5E7',
  ink: '#141414',
  charcoal: '#232323',
  accent: '#EE7A3A',
  accentLight: '#FFAA6E',
  white: '#FFFFFF',
  /** Secondary text on light surfaces. Never go lighter than this. */
  textSecondary: '#555555',
  /** Secondary text on charcoal surfaces. */
  textOnDarkSecondary: '#B5B5B5',
  textOnDarkMuted: '#8A8A8A',
  divider: '#EDEDED',
  hairline: '#D6D6D6',
  danger: '#E23B4A',
  success: '#2FA36B',
} as const;

export const fonts = {
  regular: 'BricolageGrotesque_400Regular',
  medium: 'BricolageGrotesque_500Medium',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
} as const;

/** Type scale. 13px is the smallest size the app uses. */
export const type = {
  display: { fontFamily: fonts.semibold, fontSize: 60, letterSpacing: -2.7, lineHeight: 64 },
  title: { fontFamily: fonts.medium, fontSize: 29, letterSpacing: -1.16, lineHeight: 31 },
  headline: { fontFamily: fonts.medium, fontSize: 32, letterSpacing: -1.28, lineHeight: 35 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19 },
  section: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  button: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
} as const;

export type TypeVariant = keyof typeof type;

export const radii = {
  icon: 13,
  row: 24,
  card: 28,
  hero: 30,
  large: 34,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
} as const;

/** Floating tab bar size, so screens can leave room for it. */
export const tabBar = {
  width: 250,
  height: 64,
  bottomGap: 28,
} as const;
