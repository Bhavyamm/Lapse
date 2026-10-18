import { render } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { useRootNavigationState } from 'expo-router';
import { Alert } from 'react-native';

import { handleResponse, Reminders } from '@/components/reminders';
import { syncReminders } from '@/features/reminders/sync';
import { useSettings } from '@/stores/settings';
import { useSubscriptions } from '@/stores/subscriptions';

jest.mock('expo-notifications', () => ({
  useLastNotificationResponse: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn() },
  useRootNavigationState: jest.fn(),
}));
jest.mock('@/features/reminders/sync', () => ({
  ...jest.requireActual('@/features/reminders/sync'),
  syncReminders: jest.fn(),
}));

const initial = useSubscriptions.getState();
const initialSettings = useSettings.getState();
const duo = {
  id: 'd',
  serviceId: 'duolingo-max',
  name: 'Duolingo Max',
  priceCents: 2999,
  currency: 'USD' as const,
  cycle: 'month' as const,
  chargeOn: '2026-10-18',
  trial: true,
  createdAt: '2026-10-04T09:00:00.000Z',
};
const data = { subscriptionId: 'd', kind: 'trial' as const, chargeOn: '2026-10-18' };
const tap = 'expo.modules.notifications.actions.DEFAULT';

beforeAll(() => jest.useFakeTimers({ now: new Date(2026, 9, 17, 9, 0), advanceTimers: true }));
afterAll(() => jest.useRealTimers());
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  useSubscriptions.setState({ ...initial, subscriptions: [duo] }, true);
  useSettings.setState({ ...initialSettings, hasOnboarded: true, remindersEnabled: true }, true);
});

const router = () => jest.requireMock('expo-router').router;

describe('Reminder taps and buttons', () => {
  it('opens the Trial screen from a trial reminder', () => {
    handleResponse(data, tap);
    expect(router().push).toHaveBeenCalledWith({ pathname: '/trial/[id]', params: { id: 'd' } });
  });

  it('opens the monthly check-in from its reminder', () => {
    handleResponse({ subscriptionId: '', kind: 'checkin', chargeOn: '2026-11-01' }, tap);
    expect(router().navigate).toHaveBeenCalledWith('/check-in');
  });

  it('opens the cancel steps from "Cancel the trial"', () => {
    handleResponse(data, 'cancel');
    expect(router().push).toHaveBeenCalledWith({ pathname: '/subscription/[id]', params: { id: 'd' } });
  });

  it('opens the detail from a renewal reminder', () => {
    useSubscriptions.setState({ subscriptions: [{ ...duo, trial: false }] });
    handleResponse({ ...data, kind: 'renewal' }, tap);
    expect(router().push).toHaveBeenCalledWith({ pathname: '/subscription/[id]', params: { id: 'd' } });
  });

  it('"Remind me tonight" sets a reminder for 8 PM and says so', () => {
    handleResponse(data, 'tonight');

    expect(useSubscriptions.getState().subscriptions[0].snoozeUntil).toBe(new Date(2026, 9, 17, 20, 0).getTime());
    expect(jest.mocked(Alert.alert).mock.calls[0][1]).toMatch(/^We’ll remind you about Duolingo Max at 8:00/);
  });

  it('"I’ll keep it" stops the trial reminders', () => {
    handleResponse(data, 'keep');

    expect(useSubscriptions.getState().subscriptions[0].trialKept).toBe(true);
    expect(jest.mocked(Alert.alert).mock.calls[0][1]).toBe('No more reminders about the Duolingo Max trial.');
  });

  it('ignores buttons for a subscription that’s gone', () => {
    useSubscriptions.setState({ subscriptions: [] });
    handleResponse(data, 'keep');
    handleResponse(undefined, tap);

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(router().push).not.toHaveBeenCalled();
  });

  it('opens the detail instead of snoozing when no time is left', () => {
    useSubscriptions.setState({ subscriptions: [{ ...duo, chargeOn: '2026-10-17' }] });
    jest.setSystemTime(new Date(2026, 9, 17, 23, 30));
    try {
      handleResponse(data, 'tonight');
    } finally {
      jest.setSystemTime(new Date(2026, 9, 17, 9, 0));
    }
    expect(useSubscriptions.getState().subscriptions[0].snoozeUntil).toBeUndefined();
    expect(router().push).toHaveBeenCalledWith({ pathname: '/subscription/[id]', params: { id: 'd' } });
  });
});

describe('Reminders', () => {
  const response = {
    notification: { date: 1, request: { identifier: 'd:2026-10-18', content: { data } } },
    actionIdentifier: tap,
  };

  it('syncs on mount and when subscriptions change', async () => {
    await render(<Reminders />);
    expect(syncReminders).toHaveBeenCalledTimes(1);

    useSubscriptions.getState().update('d', { priceCents: 1999 });
    expect(syncReminders).toHaveBeenCalledTimes(2);
  });

  it('waits for navigation, then handles a tap once', async () => {
    jest.mocked(Notifications.useLastNotificationResponse).mockReturnValue(response as never);
    jest.mocked(useRootNavigationState).mockReturnValue(undefined as never);
    const view = await render(<Reminders />);
    expect(router().push).not.toHaveBeenCalled();

    jest.mocked(useRootNavigationState).mockReturnValue({ key: 'root' } as never);
    await view.rerender(<Reminders />);
    await view.rerender(<Reminders />);

    expect(router().push).toHaveBeenCalledTimes(1);
    expect(router().push).toHaveBeenCalledWith({ pathname: '/trial/[id]', params: { id: 'd' } });
    expect(Notifications.clearLastNotificationResponse).toHaveBeenCalledTimes(1);
  });

  it('waits until onboarding is done', async () => {
    useSettings.setState({ hasOnboarded: false });
    jest.mocked(Notifications.useLastNotificationResponse).mockReturnValue(response as never);
    jest.mocked(useRootNavigationState).mockReturnValue({ key: 'root' } as never);
    await render(<Reminders />);

    expect(router().push).not.toHaveBeenCalled();
  });
});
