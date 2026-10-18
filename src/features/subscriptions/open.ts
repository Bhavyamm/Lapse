import { router } from 'expo-router';

/** Opens a subscription: the Trial screen while its free trial runs, otherwise its detail. */
export function openSubscription(id: string, trialRunning = false) {
  if (trialRunning) router.push({ pathname: '/trial/[id]', params: { id } });
  else router.push({ pathname: '/subscription/[id]', params: { id } });
}

/** The detail screen, where a subscription gets cancelled. */
export function openDetail(id: string) {
  router.push({ pathname: '/subscription/[id]', params: { id } });
}
