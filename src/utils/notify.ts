import { Alert, Platform } from 'react-native';

/** A short message with an OK button. react-native-web's Alert does nothing, so web uses the browser's. */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

type ConfirmOptions = {
  /** What the cancel button says; name what it keeps, such as "Keep editing". */
  cancel?: string;
  /** Draws `action` in red, for choices that throw something away. */
  destructive?: boolean;
};

/** Asks a yes/no question. Resolves true when the person picks `action`. */
export function confirm(
  title: string,
  message: string,
  action: string,
  { cancel = 'Not now', destructive = false }: ConfirmOptions = {},
): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: cancel, style: 'cancel', onPress: () => resolve(false) },
        { text: action, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
