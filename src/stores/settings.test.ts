import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_REMINDER_LEAD } from '@/features/reminders/lead-time';

import { useSettings } from './settings';

const STORAGE_KEY = 'lapse.settings';
const initial = useSettings.getState();

describe('settings store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSettings.setState(initial, true);
  });

  it('starts not onboarded, reminders off, and 1 day before as the default timing', () => {
    const state = useSettings.getState();

    expect(state.hasOnboarded).toBe(false);
    expect(state.remindersEnabled).toBe(false);
    expect(state.reminderLead).toBe(DEFAULT_REMINDER_LEAD);
    expect(DEFAULT_REMINDER_LEAD).toBe('oneDay');
  });

  it('changes the reminder timing', () => {
    useSettings.getState().setReminderLead('threeDays');

    expect(useSettings.getState().reminderLead).toBe('threeDays');
  });

  it('marks onboarding done and records whether reminders were allowed', () => {
    useSettings.getState().completeOnboarding(true);

    expect(useSettings.getState()).toMatchObject({ hasOnboarded: true, remindersEnabled: true });
  });

  it('records reminders as off when onboarding is finished without permission', () => {
    useSettings.getState().completeOnboarding(false);

    expect(useSettings.getState()).toMatchObject({ hasOnboarded: true, remindersEnabled: false });
  });

  it('reset puts settings back to a fresh install', () => {
    useSettings.getState().setReminderLead('threeDays');
    useSettings.getState().completeOnboarding(true);
    useSettings.getState().setAppLock(true);

    useSettings.getState().reset();

    expect(useSettings.getState()).toMatchObject({
      hasOnboarded: false,
      remindersEnabled: false,
      reminderLead: DEFAULT_REMINDER_LEAD,
      appLock: false,
    });
  });

  it('saves only the settings values, not actions or the hydrated flag', async () => {
    useSettings.getState().setReminderLead('morningOf');
    useSettings.getState().completeOnboarding(true);

    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? 'null');
    expect(saved).toEqual({
      state: { hasOnboarded: true, remindersEnabled: true, reminderLead: 'morningOf', appLock: false },
      version: 1,
    });
  });

  it('restores saved settings from storage and marks itself hydrated', async () => {
    // Reset first: every setState is written through to storage.
    useSettings.setState({ hydrated: false });
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { hasOnboarded: true, remindersEnabled: false, reminderLead: 'threeDays' }, version: 1 }),
    );

    await useSettings.persist.rehydrate();

    expect(useSettings.getState()).toMatchObject({ hydrated: true, hasOnboarded: true, reminderLead: 'threeDays' });
  });

  it('still marks itself hydrated with defaults when storage fails, so the app can open', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk full'));
    useSettings.setState({ hydrated: false });

    await Promise.resolve(useSettings.persist.rehydrate()).catch(() => {});

    expect(useSettings.getState().hydrated).toBe(true);
    expect(useSettings.getState().hasOnboarded).toBe(false);
  });
});
