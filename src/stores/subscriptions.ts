import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { NewSubscription, Subscription } from '@/features/subscriptions/types';

export type SubscriptionsState = {
  /** True once saved subscriptions were read, or reading failed. Not persisted. */
  hydrated: boolean;
  subscriptions: Subscription[];
  /** Saves new subscriptions and returns them with their ids. */
  add: (items: NewSubscription[]) => Subscription[];
  remove: (id: string) => void;
};

let counter = 0;
/** Unique enough for one phone: time, a per-session counter and randomness. */
function newId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Subscriptions saved on the phone. AsyncStorage for now so it runs in Expo Go;
 * the encrypted SQLite store replaces it when the app moves to a development build.
 */
export const useSubscriptions = create<SubscriptionsState>()(
  persist(
    (set) => ({
      hydrated: false,
      subscriptions: [],
      add: (items) => {
        const createdAt = new Date().toISOString();
        const added = items.map((item) => ({ ...item, id: newId(), currency: 'USD' as const, createdAt }));
        set((s) => ({ subscriptions: [...s.subscriptions, ...added] }));
        return added;
      },
      remove: (id) => set((s) => ({ subscriptions: s.subscriptions.filter((sub) => sub.id !== id) })),
    }),
    {
      name: 'lapse.subscriptions',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => useSubscriptions.setState({ hydrated: true }),
      partialize: ({ subscriptions }) => ({ subscriptions }),
    },
  ),
);

export function useSubscriptionsHydrated(): boolean {
  return useSubscriptions((s) => s.hydrated);
}
