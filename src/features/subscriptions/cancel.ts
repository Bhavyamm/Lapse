import type { PlatformOSType } from 'react-native';

import { findService } from '@/features/catalog/catalog';

import type { Subscription } from './types';

export type CancelGuide = {
  steps: string[];
  /** Where the main button goes. */
  url: string;
  /** The main button, such as "Open Netflix cancel page". */
  action: string;
  /** "About 1 min", or vaguer when the steps are general. */
  time: string;
  /** For a service billed on its own site: the store page, in case it was bought in an app. */
  storeUrl?: string;
};

const STORE: Record<'ios' | 'android', { name: string; url: string; button: string }> = {
  ios: { name: 'App Store', url: 'https://apps.apple.com/account/subscriptions', button: 'Cancel Subscription' },
  android: {
    name: 'Google Play',
    url: 'https://play.google.com/store/account/subscriptions',
    button: 'Cancel subscription',
  },
};

/**
 * How to cancel `sub`: the service's own steps when the catalog knows them, store steps for
 * App Store or Google Play billing, and general steps with a web search otherwise.
 * `until` is the formatted date access lasts to.
 */
export function cancelGuide(sub: Subscription, until: string, platform: PlatformOSType): CancelGuide {
  const cancel = findService(sub.serviceId)?.cancel;
  const last = `You keep access until ${until}. Then come back and tap I already cancelled.`;
  // Apple's own services are always billed by Apple; "store" means whichever store this phone uses.
  const store = cancel === 'apple' || platform !== 'android' ? STORE.ios : STORE.android;

  if (cancel === 'apple' || (cancel === 'store' && platform !== 'web')) {
    return {
      steps: [`Open your ${store.name} subscriptions.`, `Tap ${sub.name}, then ${store.button}.`, last],
      url: store.url,
      action: `Open ${store.name} subscriptions`,
      time: 'About 1 min',
    };
  }
  if (cancel && typeof cancel === 'object') {
    return {
      steps: [...cancel.steps, last],
      url: cancel.url,
      action: `Open ${sub.name} cancel page`,
      time: 'About 1 min',
    };
  }
  return {
    steps: [
      `Open ${sub.name}’s website or app and sign in.`,
      'Go to your account, plan or billing settings and choose Cancel.',
      last,
    ],
    url: `https://www.google.com/search?q=${encodeURIComponent(`how to cancel ${sub.name}`)}`,
    action: `Search how to cancel ${sub.name}`,
    time: 'A few minutes',
    storeUrl: platform === 'web' ? undefined : store.url,
  };
}

/** The store's name for the "bought it in an app?" link. */
export function storeName(platform: PlatformOSType): string {
  return platform === 'android' ? STORE.android.name : STORE.ios.name;
}
