import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { REMINDER_CHANNEL_ID, requestReminderPermission } from './permissions';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const setChannel = Notifications.setNotificationChannelAsync as jest.Mock;

const status = (granted: boolean, canAskAgain = true) => ({
  granted,
  canAskAgain,
  status: granted ? 'granted' : 'denied',
});

function setPlatform(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
}

describe('requestReminderPermission', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    setPlatform('ios');
  });

  afterAll(() => setPlatform(originalOS));

  it('returns true without asking again when notifications are already allowed', async () => {
    getPermissions.mockResolvedValue(status(true));

    await expect(requestReminderPermission()).resolves.toBe(true);
    expect(requestPermissions).not.toHaveBeenCalled();
  });

  it('asks the OS and returns true when the person allows notifications', async () => {
    getPermissions.mockResolvedValue(status(false));
    requestPermissions.mockResolvedValue(status(true));

    await expect(requestReminderPermission()).resolves.toBe(true);
    expect(requestPermissions).toHaveBeenCalledTimes(1);
  });

  it('returns false when the person declines the prompt', async () => {
    getPermissions.mockResolvedValue(status(false));
    requestPermissions.mockResolvedValue(status(false));

    await expect(requestReminderPermission()).resolves.toBe(false);
  });

  it('returns false without prompting when the OS will not ask again', async () => {
    getPermissions.mockResolvedValue(status(false, false));

    await expect(requestReminderPermission()).resolves.toBe(false);
    expect(requestPermissions).not.toHaveBeenCalled();
  });

  it('returns false instead of throwing when the permission call fails', async () => {
    getPermissions.mockRejectedValue(new Error('native module missing'));

    await expect(requestReminderPermission()).resolves.toBe(false);
  });

  it('returns false on web without touching the notifications module', async () => {
    setPlatform('web');

    await expect(requestReminderPermission()).resolves.toBe(false);
    expect(getPermissions).not.toHaveBeenCalled();
  });

  it('creates the reminders channel before asking on Android, so the Android 13+ prompt can show', async () => {
    setPlatform('android');
    const order: string[] = [];
    setChannel.mockImplementation(async () => order.push('channel'));
    getPermissions.mockImplementation(async () => {
      order.push('get');
      return status(false);
    });
    requestPermissions.mockImplementation(async () => {
      order.push('request');
      return status(true);
    });

    await expect(requestReminderPermission()).resolves.toBe(true);
    expect(setChannel).toHaveBeenCalledWith(REMINDER_CHANNEL_ID, expect.objectContaining({ name: 'Reminders' }));
    expect(order).toEqual(['channel', 'get', 'request']);
  });

  it('does not create an Android channel on iOS', async () => {
    getPermissions.mockResolvedValue(status(true));

    await requestReminderPermission();
    expect(setChannel).not.toHaveBeenCalled();
  });
});
