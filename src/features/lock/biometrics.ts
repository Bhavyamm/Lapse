import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type Biometrics = {
  /** The phone has biometrics and someone has set them up. */
  ready: boolean;
  /** "Face ID", "Touch ID", or "Biometric" where the kind isn't known. */
  name: string;
};

/** What this phone offers for the app lock. Never throws; web has none. */
export async function getBiometrics(): Promise<Biometrics> {
  if (Platform.OS === 'web') return { ready: false, name: 'Biometric' };
  try {
    const [hardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    const { FACIAL_RECOGNITION, FINGERPRINT } = LocalAuthentication.AuthenticationType;
    let name = 'Biometric';
    if (Platform.OS === 'ios' && types.includes(FACIAL_RECOGNITION)) name = 'Face ID';
    else if (Platform.OS === 'ios' && types.includes(FINGERPRINT)) name = 'Touch ID';
    return { ready: hardware && enrolled, name };
  } catch {
    return { ready: false, name: 'Biometric' };
  }
}

export type UnlockResult = 'unlocked' | 'failed' | 'unavailable';

/** Errors that mean this phone can no longer check Face ID or the passcode at all. */
const UNAVAILABLE = new Set(['not_available', 'not_enrolled', 'passcode_not_set']);

/**
 * Asks for Face ID (falling back to the passcode). "unavailable" means the phone can't check
 * at all any more, such as after the passcode was removed, so the lock must stand down.
 */
export async function unlock(reason: string): Promise<UnlockResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: 'Cancel' });
    if (result.success) return 'unlocked';
    return UNAVAILABLE.has(result.error) ? 'unavailable' : 'failed';
  } catch {
    return 'failed';
  }
}
