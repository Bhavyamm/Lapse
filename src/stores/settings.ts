import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_REMINDER_LEAD, type ReminderLead } from '@/features/reminders/lead-time';
import { appStorage } from '@/features/storage/app-storage';

export type SettingsState = {
  /**
   * True once saved settings were read, or reading them failed and defaults
   * are in use. Not persisted. zustand's own hasHydrated() stays false when
   * storage throws, which would hold the splash screen forever.
   */
  hydrated: boolean;
  /** True once the person has passed the Turn on reminders screen. */
  hasOnboarded: boolean;
  /** True when the person wants reminders and the OS allowed notifications. */
  remindersEnabled: boolean;
  reminderLead: ReminderLead;
  setReminderLead: (lead: ReminderLead) => void;
  setRemindersEnabled: (on: boolean) => void;
  /** Ask for Face ID (or the phone's biometrics) when the app opens. */
  appLock: boolean;
  setAppLock: (on: boolean) => void;
  completeOnboarding: (remindersEnabled: boolean) => void;
  /** Puts onboarding back to a fresh-install state. Development builds only. */
  resetOnboarding: () => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,
      hasOnboarded: false,
      remindersEnabled: false,
      reminderLead: DEFAULT_REMINDER_LEAD,
      setReminderLead: (reminderLead) => set({ reminderLead }),
      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),
      appLock: false,
      setAppLock: (appLock) => set({ appLock }),
      completeOnboarding: (remindersEnabled) => set({ hasOnboarded: true, remindersEnabled }),
      resetOnboarding: () => set({ hasOnboarded: false, remindersEnabled: false, reminderLead: DEFAULT_REMINDER_LEAD }),
    }),
    {
      name: 'lapse.settings',
      version: 1,
      storage: createJSONStorage(() => appStorage),
      onRehydrateStorage: () => () => useSettings.setState({ hydrated: true }),
      partialize: ({ hasOnboarded, remindersEnabled, reminderLead, appLock }) => ({
        hasOnboarded,
        remindersEnabled,
        reminderLead,
        appLock,
      }),
    },
  ),
);

/** True once saved settings have been read from storage (or failed to load). */
export function useSettingsHydrated(): boolean {
  return useSettings((s) => s.hydrated);
}
