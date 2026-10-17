import { Linking } from 'react-native';

import { notify } from '@/utils/notify';

/** Opens a web page or another app. Says so when the phone can't, instead of failing silently. */
export async function openLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    notify('Couldn’t open the link', 'Your phone has nothing to open it with. Try again from a browser.');
  }
}
