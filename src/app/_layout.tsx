import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  useFonts,
} from '@expo-google-fonts/bricolage-grotesque';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppLock } from '@/components/app-lock';
import { LaunchSplash } from '@/components/launch-splash';
import { useLock } from '@/stores/lock';
import { useSettings, useSettingsHydrated } from '@/stores/settings';
import { useSubscriptionsHydrated } from '@/stores/subscriptions';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
  });

  const settingsHydrated = useSettingsHydrated();
  const subscriptionsHydrated = useSubscriptionsHydrated();
  const hydrated = settingsHydrated && subscriptionsHydrated;
  const hasOnboarded = useSettings((s) => s.hasOnboarded);
  const ready = (loaded || !!error) && hydrated;
  // The lapse. splash plays once per launch, over whichever screen the app opens on.
  const [splashing, setSplashing] = useState(true);
  const endSplash = useCallback(() => setSplashing(false), []);
  const locked = useLock((s) => s.locked);
  const covered = splashing || locked;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      {/* Hidden from screen readers while the splash or the lock covers it. */}
      <View
        style={{ flex: 1 }}
        aria-hidden={covered}
        importantForAccessibility={covered ? 'no-hide-descendants' : 'auto'}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
          <Stack.Protected guard={!hasOnboarded}>
            <Stack.Screen name="reminders" />
          </Stack.Protected>
          <Stack.Protected guard={hasOnboarded}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="add" />
            <Stack.Screen name="subscription/[id]" />
          </Stack.Protected>
        </Stack>
      </View>
      {/* Under the splash, so a locked app shows the lock as the splash fades. */}
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
        aria-hidden={splashing}
        importantForAccessibility={splashing ? 'no-hide-descendants' : 'auto'}>
        <AppLock canPrompt={!splashing} />
      </View>
      {splashing ? <LaunchSplash onDone={endSplash} /> : null}
    </>
  );
}
