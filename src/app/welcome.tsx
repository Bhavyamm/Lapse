import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AppLogo } from '@/components/app-logo';
import { AppText } from '@/components/app-text';
import { LockIcon } from '@/components/icons';
import { Mascot } from '@/components/mascot';
import { colors } from '@/theme';

/** First screen of onboarding. Tapping anywhere moves on to reminders. */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      role="button"
      aria-label="lapse. Catch every charge before it lands. Your data stays on this phone. Continue"
      accessibilityHint="Shows how reminders work"
      onPress={() => router.push('/reminders')}
      style={styles.root}>
      <StatusBar style="light" />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="welcomeBg" cx="50%" cy="42%" rx="120%" ry="70%">
            <Stop offset="0" stopColor={colors.nightRaised} />
            <Stop offset="0.7" stopColor={colors.night} />
          </RadialGradient>
          <RadialGradient id="welcomeGlow" cx="50%" cy="58%" rx="55%" ry="26%">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.14} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#welcomeBg)" />
        <Rect width="100%" height="100%" fill="url(#welcomeGlow)" />
      </Svg>

      <View style={[styles.center, { paddingTop: insets.top }]}>
        <View style={styles.logo}>
          <AppLogo size={116} />
        </View>
        <View style={styles.wordmarkRow}>
          <AppText variant="wordmark" onDark>
            lapse
          </AppText>
          <AppText variant="wordmark" style={{ color: colors.accent }}>
            .
          </AppText>
        </View>
        <AppText onDark muted style={styles.tagline}>
          Catch every charge before it lands.
        </AppText>
        <View style={styles.privacy}>
          <LockIcon color={colors.textOnDarkMuted} />
          <AppText variant="caption" style={styles.privacyText}>
            Your data stays on this phone
          </AppText>
        </View>
      </View>

      <View style={styles.mascotArea} pointerEvents="none">
        <View style={styles.bubble}>
          <AppText variant="bubble">{'Hi! Let’s catch those\nsneaky charges.'}</AppText>
        </View>
        <View style={styles.mascot}>
          <Mascot size={250} shadow={false} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.night,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 170,
  },
  logo: {
    borderRadius: 36,
    boxShadow: '0 28px 60px rgba(0,0,0,0.5)',
    marginBottom: 22,
  },
  wordmarkRow: {
    flexDirection: 'row',
  },
  tagline: {
    marginTop: 10,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  privacyText: {
    color: colors.textOnDarkMuted,
  },
  mascotArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
    alignItems: 'center',
  },
  bubble: {
    position: 'absolute',
    bottom: 196,
    left: '50%',
    marginLeft: 4,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingVertical: 11,
    paddingHorizontal: 15,
    boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
    zIndex: 1,
  },
  mascot: {
    position: 'absolute',
    bottom: -64,
    left: '50%',
    marginLeft: -150,
  },
});
