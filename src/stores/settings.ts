import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_REMINDER_LEAD, type ReminderLead } from '@/features/reminders/lead-time';

export type SettingsState = {
  /**
   * True once saved settings were read, or reading them failed and defaults
   * are in use. Not persisted. zustand's own hasHydrated() stays false when
   * storage throws, which would hold the splash screen forever.
   */
  hydrated: boolean;
  /** True once the person has passed the welcome and reminders screens. */
  hasOnboarded: boolean;
  /** True when the OS allowed notifications during onboarding. */
  remindersEnabled: boolean;
  reminderLead: ReminderLead;
  setReminderLead: (lead: ReminderLead) => void;
  completeOnboarding: (remindersEnabled: boolean) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,
      hasOnboarded: false,
      remindersEnabled: false,
      reminderLead: DEFAULT_REMINDER_LEAD,
      setReminderLead: (reminderLead) => set({ reminderLead }),
      completeOnboarding: (remindersEnabled) => set({ hasOnboarded: true, remindersEnabled }),
    }),
    {
      name: 'lapse.settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => useSettings.setState({ hydrated: true }),
      partialize: ({ hasOnboarded, remindersEnabled, reminderLead }) => ({
        hasOnboarded,
        remindersEnabled,
        reminderLead,
      }),
    },
  ),
);

/** True once saved settings have been read from storage (or failed to load). */
export function useSettingsHydrated(): boolean {
  return useSettings((s) => s.hydrated);
}
