import { Alert, Platform } from 'react-native';

/** A short message with an OK button. react-native-web's Alert does nothing, so web uses the browser's. */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
