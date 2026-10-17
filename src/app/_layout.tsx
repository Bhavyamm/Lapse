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
import { useEffect, useState } from 'react';

import { LaunchSplash } from '@/components/launch-splash';
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

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={splashing ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Protected guard={!hasOnboarded}>
          <Stack.Screen name="reminders" />
        </Stack.Protected>
        <Stack.Protected guard={hasOnboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add" />
        </Stack.Protected>
      </Stack>
      {splashing ? <LaunchSplash onDone={() => setSplashing(false)} /> : null}
    </>
  );
}
