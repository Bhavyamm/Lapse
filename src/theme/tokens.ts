/**
 * Design tokens for the "Bold style · charcoal and orange" theme.
 * Values come from the final screen designs (Bricolage Grotesque, gray canvas,
 * charcoal cards, orange accent, Liquid Glass cards).
 */

export const colors = {
  canvas: '#E6E5E7',
  ink: '#141414',
  charcoal: '#232323',
  /** Darkest backdrop, used behind the launch splash. */
  night: '#161616',
  nightRaised: '#2A2A2A',
  /** Strong text that is not quite ink, such as quiet buttons. */
  inkSoft: '#3A3A3A',
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
  /** Dims the screen behind a bottom sheet. */
  scrim: 'rgba(20,20,20,0.35)',
  /** Round button or pill on a charcoal card. */
  onDarkButton: 'rgba(255,255,255,0.12)',
  /** Raised tile inside a charcoal card. */
  onDarkPanel: 'rgba(255,255,255,0.08)',
  /** Round button on an orange screen. */
  inkWash: 'rgba(20,20,20,0.08)',
  /** The light sheet over an orange screen. */
  sheetOnAccent: 'rgba(255,255,255,0.6)',
  /** Light panel inside an orange card. */
  onAccentPanel: 'rgba(255,255,255,0.45)',
  danger: '#E23B4A',
  success: '#2FA36B',
} as const;

/** Brand gradient stops for the logo, mascot-style glossy orange and dark card. */
export const brand = {
  orangeHighlight: '#FFB07A',
  orange: '#EE7A3A',
  orangeDeep: '#C9541F',
  peach: '#FFD2B0',
  /** Faint gray glow at the bottom of the canvas. */
  cool: '#6E6E7D',
  cardLight: '#2E2E2E',
  cardDark: '#0E0E0E',
  /** Light card behind a sample notification. */
  notificationSurface: 'rgba(255,255,255,0.94)',
} as const;

export const fonts = {
  regular: 'BricolageGrotesque_400Regular',
  medium: 'BricolageGrotesque_500Medium',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
} as const;

/** Type scale. 13px is the smallest size the app uses. */
export const type = {
  wordmark: { fontFamily: fonts.semibold, fontSize: 52, letterSpacing: -2.6, lineHeight: 56 },
  display: { fontFamily: fonts.semibold, fontSize: 60, letterSpacing: -2.7, lineHeight: 64 },
  title: { fontFamily: fonts.medium, fontSize: 29, letterSpacing: -1.16, lineHeight: 31 },
  hero: { fontFamily: fonts.medium, fontSize: 36, letterSpacing: -1.44, lineHeight: 37 },
  headline: { fontFamily: fonts.medium, fontSize: 32, letterSpacing: -1.28, lineHeight: 35 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19 },
  link: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  bubble: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 19 },
  lede: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  section: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  button: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  /** The days-left number on the Trial screen. */
  countdown: { fontFamily: fonts.medium, fontSize: 114, letterSpacing: -4.5, lineHeight: 104 },
  /** The "$" and cents beside a display-size amount. */
  amountUnit: { fontFamily: fonts.medium, fontSize: 26, letterSpacing: -1.1, lineHeight: 30 },
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
