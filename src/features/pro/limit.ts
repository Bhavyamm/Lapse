import { router } from 'expo-router';

import { usePro } from '@/features/pro/purchase';
import { useSubscriptions } from '@/stores/subscriptions';

/** How many subscriptions the free plan tracks. Pro tracks any number. */
export const FREE_LIMIT = 2;

/** How many more subscriptions can be added on this plan. */
export function roomLeft(tracked: number, isPro: boolean): number {
  return isPro ? Infinity : Math.max(FREE_LIMIT - tracked, 0);
}

/** Opens Pro, explaining that the free plan is full. */
export function openLimit() {
  router.push({ pathname: '/pro', params: { reason: 'limit' } });
}

/** Opens Add a subscription, or Pro when the free plan has no room left. */
export function openAdd() {
  const tracked = useSubscriptions.getState().subscriptions.length;
  if (roomLeft(tracked, usePro.getState().isPro) === 0) openLimit();
  else router.push('/add');
}
