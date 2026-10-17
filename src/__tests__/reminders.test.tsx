import { Alert } from 'react-native';

import { handleResponse } from '@/components/reminders';
import { useSubscriptions } from '@/stores/subscriptions';

jest.mock('expo-notifications', () => ({}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useRootNavigationState: jest.fn() }));

const initial = useSubscriptions.getState();
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
});

const router = () => jest.requireMock('expo-router').router;

describe('Reminder taps and buttons', () => {
  it('opens the Trial screen from a trial reminder', () => {
    handleResponse(data, tap);
    expect(router().push).toHaveBeenCalledWith({ pathname: '/trial/[id]', params: { id: 'd' } });
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
});
