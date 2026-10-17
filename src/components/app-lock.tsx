import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AppLogo } from '@/components/app-logo';
import { AppText } from '@/components/app-text';
import { LockIcon } from '@/components/icons';
import { PillButton } from '@/components/pill-button';
import { getBiometrics, unlock } from '@/features/lock/biometrics';
import { useSettings } from '@/stores/settings';
import { colors, spacing } from '@/theme';

type Props = {
  /** False while something covers the app (the launch splash); the prompt waits for it. */
  canPrompt: boolean;
  /** Reports whether the app is locked, so the layout can hide the screens behind it. */
  onLockedChange: (locked: boolean) => void;
};

/**
 * Covers the app when the Face ID lock is on: at launch and whenever the app comes back from
 * the background. It asks for Face ID right away; the button asks again after a cancel.
 */
export function AppLock({ canPrompt, onLockedChange }: Props) {
  // Read once on mount: the layout mounts this after saved settings are loaded.
  const [locked, setLocked] = useState(() => useSettings.getState().appLock);
  // Bumped each time the app returns from the background, so the prompt shows again.
  const [returns, setReturns] = useState(0);
  const [name, setName] = useState('Face ID');
  const wasBackground = useRef(false);

  useEffect(() => onLockedChange(locked), [locked, onLockedChange]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        wasBackground.current = true;
        if (useSettings.getState().appLock) setLocked(true);
      } else if (state === 'active' && wasBackground.current) {
        // Only after the background: the Face ID prompt itself makes iOS go inactive and back.
        wasBackground.current = false;
        setReturns((n) => n + 1);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    getBiometrics().then((b) => !cancelled && setName(b.name));
    return () => {
      cancelled = true;
    };
  }, []);

  const tryUnlock = async () => {
    if (await unlock('Unlock lapse.')) setLocked(false);
  };

  useEffect(() => {
    if (!locked || !canPrompt) return;
    let cancelled = false;
    unlock('Unlock lapse.').then((ok) => ok && !cancelled && setLocked(false));
    return () => {
      cancelled = true;
    };
  }, [locked, canPrompt, returns]);

  if (!locked) return null;
  return (
    <View style={styles.screen} aria-modal>
      <StatusBar style="light" />
      <View style={styles.center}>
        <AppLogo size={88} />
        <View style={styles.title}>
          <LockIcon size={16} color={colors.textOnDarkSecondary} />
          <AppText variant="headline" onDark>
            lapse. is locked
          </AppText>
        </View>
        <AppText variant="label" onDark muted style={styles.copy}>
          Your subscriptions stay private on this phone.
        </AppText>
      </View>
      <PillButton
        label={`Unlock with ${name}`}
        icon={<LockIcon size={18} color={colors.white} />}
        onPress={tryUnlock}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.night,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: 56,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  copy: {
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
