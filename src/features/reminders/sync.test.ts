import * as Notifications from 'expo-notifications';

import type { Subscription } from '@/features/subscriptions/types';

import { syncReminders } from './sync';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

const spotify: Subscription = {
  id: 's',
  serviceId: 'spotify',
  name: 'Spotify',
  priceCents: 1199,
  currency: 'USD',
  cycle: 'month',
  chargeOn: '2026-10-19',
  trial: false,
  createdAt: '2026-10-01T00:00:00.000Z',
};
const on = { remindersEnabled: true, reminderLead: 'oneDay' as const };

beforeAll(() => jest.useFakeTimers({ now: new Date(2026, 9, 16, 8, 0), advanceTimers: true }));
afterAll(() => jest.useRealTimers());
beforeEach(() => jest.clearAllMocks());

describe('syncReminders', () => {
  it('replaces the scheduled reminders with the planned ones', async () => {
    await syncReminders([spotify], on);

    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith('trial', [
      expect.objectContaining({ identifier: 'cancel', buttonTitle: 'Cancel the trial' }),
      expect.objectContaining({ identifier: 'tonight', buttonTitle: 'Remind me tonight' }),
      expect.objectContaining({ identifier: 'keep', buttonTitle: 'I’ll keep it' }),
    ]);
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 's:2026-10-19',
      content: {
        title: 'Spotify renews tomorrow',
        body: '$11.99 a month, renews Mon, Oct 19',
        data: { subscriptionId: 's', kind: 'renewal', chargeOn: '2026-10-19' },
        categoryIdentifier: undefined,
      },
      trigger: { type: 'date', date: new Date(2026, 9, 18, 9, 0), channelId: 'reminders' },
    });
  });

  it('clears everything when reminders are off', async () => {
    await syncReminders([spotify], { ...on, remindersEnabled: false });

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('runs one sync at a time', async () => {
    const order: string[] = [];
    jest.mocked(Notifications.cancelAllScheduledNotificationsAsync).mockImplementation(async () => {
      order.push('clear');
    });
    jest.mocked(Notifications.scheduleNotificationAsync).mockImplementation(async (r) => {
      order.push(r.identifier!);
      return r.identifier!;
    });

    await Promise.all([syncReminders([spotify], on), syncReminders([], on)]);

    expect(order).toEqual(['clear', 's:2026-10-19', 's:2026-11-19', 's:2026-12-19', 'clear']);
  });

  it('never throws when the phone refuses', async () => {
    jest.mocked(Notifications.cancelAllScheduledNotificationsAsync).mockRejectedValueOnce(new Error('nope'));
    await expect(syncReminders([spotify], on)).resolves.toBeUndefined();
  });
});
