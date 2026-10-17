import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AppLogo } from '@/components/app-logo';
import { AppText } from '@/components/app-text';
import { LockIcon } from '@/components/icons';
import { PillButton } from '@/components/pill-button';
import { getBiometrics, unlock, type UnlockResult } from '@/features/lock/biometrics';
import { useLock } from '@/stores/lock';
import { useSettings } from '@/stores/settings';
import { colors, spacing } from '@/theme';

type Props = {
  /** False while something covers the app (the launch splash); the prompt waits for it. */
  canPrompt: boolean;
};

/**
 * Covers the app when the Face ID lock is on: at launch and whenever the app comes back from
 * the background. It asks for Face ID right away; the button asks again after a cancel.
 * While the app is leaving the screen a plain cover hides it from the app switcher.
 */
export function AppLock({ canPrompt }: Props) {
  // Read once on mount: the layout mounts this after saved settings are loaded.
  const [locked, setLocked] = useState(() => useSettings.getState().appLock);
  // Hides the app in the app switcher, which snapshots it as it goes inactive.
  const [hidden, setHidden] = useState(false);
  // Bumped each time the app returns from the background, so the prompt shows again.
  const [returns, setReturns] = useState(0);
  const [name, setName] = useState('Face ID');
  const wasBackground = useRef(false);

  // Shared so sheets and other modals, which draw above this view, close while locked.
  useEffect(() => useLock.setState({ locked }), [locked]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const lockOn = useSettings.getState().appLock;
      if (state === 'background') {
        wasBackground.current = true;
        if (lockOn) setLocked(true);
      } else if (state === 'inactive') {
        if (lockOn) setHidden(true);
      } else if (state === 'active') {
        setHidden(false);
        // Only after the background: the Face ID prompt itself makes iOS go inactive and back.
        if (wasBackground.current) {
          wasBackground.current = false;
          setReturns((n) => n + 1);
        }
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

  const settle = (result: UnlockResult) => {
    if (result === 'failed') return;
    // The phone can't check Face ID or a passcode any more: turn the lock off rather than lock them out.
    if (result === 'unavailable') useSettings.getState().setAppLock(false);
    setLocked(false);
  };
  const tryUnlock = async () => settle(await unlock('Unlock lapse.'));

  useEffect(() => {
    // Not while in the background: the lock goes up then, and the prompt waits for the return.
    if (!locked || !canPrompt || wasBackground.current) return;
    unlock('Unlock lapse.').then(settle);
  }, [locked, canPrompt, returns]);

  if (!locked) return hidden ? <View style={styles.screen} /> : null;
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
