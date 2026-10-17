import * as Notifications from 'expo-notifications';

import type { Subscription } from '@/features/subscriptions/types';

import { syncReminders } from './sync';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
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
const scheduled = (identifier: string, data: object = {}) => ({ identifier, content: { data } });
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([] as never);
});

describe('syncReminders', () => {
  it('replaces the scheduled reminders with the planned ones', async () => {
    await syncReminders([spotify], on);

    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith('trial', [
      expect.objectContaining({ identifier: 'cancel', buttonTitle: 'Cancel the trial' }),
      expect.objectContaining({ identifier: 'tonight', buttonTitle: 'Remind me tonight' }),
      expect.objectContaining({ identifier: 'keep', buttonTitle: 'I’ll keep it' }),
    ]);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 's:2026-10-19',
      content: {
        title: 'Spotify renews tomorrow',
        body: '$11.99 a month, renews Oct 19',
        data: { subscriptionId: 's', kind: 'renewal', chargeOn: '2026-10-19' },
        categoryIdentifier: undefined,
      },
      trigger: { type: 'date', date: new Date(2026, 9, 18, 9, 0), channelId: 'reminders' },
    });
  });

  it('cancels only the reminders no longer wanted, and leaves a test reminder', async () => {
    jest
      .mocked(Notifications.getAllScheduledNotificationsAsync)
      .mockResolvedValue([
        scheduled('s:2026-10-19'),
        scheduled('gone:2026-10-20'),
        scheduled('x', { test: true }),
      ] as never);

    await syncReminders([spotify], on);

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('gone:2026-10-20');
  });

  it('clears everything when reminders are off', async () => {
    jest
      .mocked(Notifications.getAllScheduledNotificationsAsync)
      .mockResolvedValue([scheduled('s:2026-10-19')] as never);
    await syncReminders([spotify], { ...on, remindersEnabled: false });

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('s:2026-10-19');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('runs one sync at a time', async () => {
    const order: string[] = [];
    jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockImplementation(async () => {
      order.push('read');
      return [];
    });
    jest.mocked(Notifications.scheduleNotificationAsync).mockImplementation(async (r) => {
      order.push(r.identifier!);
      return r.identifier!;
    });

    await Promise.all([syncReminders([spotify], on), syncReminders([], on)]);

    expect(order).toEqual(['read', 's:2026-10-19', 's:2026-11-19', 's:2026-12-19', 'read']);
  });

  it('never throws, and schedules nothing until the buttons are registered', async () => {
    jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockRejectedValueOnce(new Error('nope'));
    await expect(syncReminders([spotify], on)).resolves.toBeUndefined();

    // A fresh launch whose button registration fails.
    let fresh: typeof syncReminders = syncReminders;
    let api: typeof Notifications = Notifications;
    jest.isolateModules(() => {
      fresh = jest.requireActual<typeof import('./sync')>('./sync').syncReminders;
      api = jest.requireMock('expo-notifications');
    });
    jest.mocked(api.getAllScheduledNotificationsAsync).mockResolvedValue([] as never);
    jest.mocked(api.setNotificationCategoryAsync).mockRejectedValueOnce(new Error('nope'));
    await expect(fresh([spotify], on)).resolves.toBeUndefined();
    expect(api.setNotificationCategoryAsync).toHaveBeenCalled();
    expect(api.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
