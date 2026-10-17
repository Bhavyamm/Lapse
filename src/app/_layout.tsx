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
import { useEffect } from 'react';

import { useSettings, useSettingsHydrated } from '@/stores/settings';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
  });

  const hydrated = useSettingsHydrated();
  const hasOnboarded = useSettings((s) => s.hasOnboarded);
  const ready = (loaded || !!error) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Protected guard={!hasOnboarded}>
          <Stack.Screen name="welcome" options={{ contentStyle: { backgroundColor: colors.night } }} />
          <Stack.Screen name="reminders" />
        </Stack.Protected>
        <Stack.Protected guard={hasOnboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
