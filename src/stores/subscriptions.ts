import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { toCancelled } from '@/features/subscriptions/savings';
import type {
  CancelledSubscription,
  NewSubscription,
  Subscription,
  SubscriptionChanges,
} from '@/features/subscriptions/types';
import type { LocalDate } from '@/utils/dates';

export type SubscriptionsState = {
  /** True once saved subscriptions were read, or reading failed. Not persisted. */
  hydrated: boolean;
  subscriptions: Subscription[];
  /** Saves new subscriptions and returns them with their ids. */
  add: (items: NewSubscription[]) => Subscription[];
  update: (id: string, changes: SubscriptionChanges) => void;
  remove: (id: string) => void;
  /** Subscriptions cancelled through the app, for the money-saved total on Profile. */
  cancelled: CancelledSubscription[];
  /** Stops tracking a subscription and remembers it as cancelled on `today`. */
  cancel: (id: string, today: LocalDate) => void;
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
      update: (id, changes) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) => {
            if (sub.id !== id) return sub;
            const next = { ...sub, ...changes };
            // A new end date or trial is a new trial to remind about: forget "keep it" and "tonight".
            if (next.chargeOn !== sub.chargeOn || next.trial !== sub.trial) {
              delete next.trialKept;
              delete next.snoozeUntil;
            }
            return next;
          }),
        })),
      remove: (id) => set((s) => ({ subscriptions: s.subscriptions.filter((sub) => sub.id !== id) })),
      cancelled: [],
      cancel: (id, today) =>
        set((s) => {
          const sub = s.subscriptions.find((x) => x.id === id);
          if (!sub) return s;
          return {
            subscriptions: s.subscriptions.filter((x) => x.id !== id),
            cancelled: [...s.cancelled, toCancelled(sub, today)],
          };
        }),
    }),
    {
      name: 'lapse.subscriptions',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => useSubscriptions.setState({ hydrated: true }),
      // Saves from before `cancelled` existed load with the empty default.
      partialize: ({ subscriptions, cancelled }) => ({ subscriptions, cancelled }),
    },
  ),
);

export function useSubscriptionsHydrated(): boolean {
  return useSubscriptions((s) => s.hydrated);
}
