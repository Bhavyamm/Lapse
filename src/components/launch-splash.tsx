import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AppLogo } from '@/components/app-logo';
import { AppText } from '@/components/app-text';
import { LockIcon } from '@/components/icons';
import { Mascot } from '@/components/mascot';
import { colors } from '@/theme';

/** How long the splash stays before it fades by itself. */
export const SPLASH_MS = 1800;
const FADE_MS = 250;

/**
 * The lapse. splash, shown over the app each time it opens. It fades out on its own,
 * or straight away when tapped, and then calls onDone. With a screen reader on it waits
 * for a tap, so the label can be read in full; with Reduce Motion it skips the fade.
 */
export function LaunchSplash({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(1));
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    // react-native-web always answers true here, so the browser keeps the timer.
    (Platform.OS === 'web' ? Promise.resolve(false) : AccessibilityInfo.isScreenReaderEnabled())
      .catch(() => false)
      .then((reader) => {
        if (!cancelled && !reader) timer = setTimeout(() => setLeaving(true), SPLASH_MS);
      });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!leaving) return;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) return onDone();
        Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(({ finished }) => {
          if (finished && !cancelled) onDone();
        });
      });
    return () => {
      cancelled = true;
    };
  }, [leaving, opacity, onDone]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} aria-modal>
      {/* Mounted after the screens, so it wins over their dark status bar until it closes. */}
      <StatusBar style="light" />
      <Pressable
        role="button"
        aria-label="lapse. Catch every charge before it lands. Your data stays on this phone. Continue"
        onPress={() => setLeaving(true)}
        style={styles.root}>
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
    </Animated.View>
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
  // The mascot peeks in from the bottom-left corner with most of its face showing (the design's
  // offsets hid half of it on a phone), and its speech bubble sits just above its head.
  mascotArea: {
    position: 'absolute',
    left: 17,
    bottom: 9,
    width: 300,
    height: 300,
  },
  bubble: {
    position: 'absolute',
    bottom: 212,
    left: 4,
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
    bottom: -34,
    left: -95,
  },
});
