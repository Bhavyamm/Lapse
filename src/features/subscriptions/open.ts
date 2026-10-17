import { router } from 'expo-router';

/** Opens a subscription's detail screen. */
export function openSubscription(id: string) {
  router.push({ pathname: '/subscription/[id]', params: { id } });
}
