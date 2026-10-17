import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { getBiometrics, unlock } from '@/features/lock/biometrics';
import { requestReminderPermission } from '@/features/reminders/permissions';
import { sendTestReminder } from '@/features/reminders/sync';
import { shareCsv } from '@/features/subscriptions/export';
import { useSettings } from '@/stores/settings';
import { useSubscriptions } from '@/stores/subscriptions';

import ProfileScreen from '@/app/(tabs)/profile';

jest.mock('@/features/lock/biometrics', () => ({ getBiometrics: jest.fn(), unlock: jest.fn() }));
jest.mock('@/features/reminders/permissions', () => ({ requestReminderPermission: jest.fn() }));
jest.mock('@/features/subscriptions/export', () => ({ shareCsv: jest.fn() }));
jest.mock('@/features/reminders/sync', () => ({ sendTestReminder: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));

const initialSettings = useSettings.getState();
const initialSubs = useSubscriptions.getState();
const dev = __DEV__;
const setDev = (value: boolean) => ((globalThis as unknown as { __DEV__: boolean }).__DEV__ = value);
const base = { currency: 'USD' as const, trial: false, cycle: 'month' as const, serviceId: null };

beforeAll(() => jest.useFakeTimers({ now: new Date(2026, 9, 16, 9, 0), advanceTimers: true }));
afterAll(() => jest.useRealTimers());
beforeEach(() => {
  jest.mocked(getBiometrics).mockResolvedValue({ ready: true, name: 'Face ID' });
  jest.mocked(unlock).mockResolvedValue('unlocked');
  jest.mocked(shareCsv).mockResolvedValue(true);
});
afterEach(() => {
  setDev(dev);
  jest.clearAllMocks();
  useSettings.setState(initialSettings, true);
  useSubscriptions.setState(initialSubs, true);
});

describe('Profile screen', () => {
  it('shows money saved and the counts', async () => {
    useSubscriptions.setState({
      subscriptions: [{ ...base, id: 'a', name: 'Netflix', priceCents: 1549, chargeOn: '2026-10-22', createdAt: 'x' }],
      cancelled: [
        {
          ...base,
          id: 'h',
          name: 'Hulu',
          priceCents: 1799,
          chargeOn: '2026-06-10',
          cancelledOn: '2026-06-01',
          savedFrom: '2026-06-10',
        },
        {
          ...base,
          id: 'd',
          name: 'Duo',
          priceCents: 2999,
          chargeOn: '2026-09-20',
          trial: true,
          cancelledOn: '2026-09-18',
          savedFrom: '2026-09-20',
        },
      ],
    });
    await render(<ProfileScreen />);

    expect(screen.getByLabelText('$119.94')).toBeOnTheScreen();
    expect(screen.getByLabelText('1 Tracked')).toBeOnTheScreen();
    expect(screen.getByLabelText('1 Cancelled')).toBeOnTheScreen();
    expect(screen.getByLabelText('1 Trial caught')).toBeOnTheScreen();
  });

  it('opens Pro from the Pro button and statement import', async () => {
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Unlock Pro, $14.99 once' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Import a statement' }));

    const navigate = jest.requireMock('expo-router').router.navigate;
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith('/pro');
  });

  it('turns reminders on from the sheet once the phone allows them', async () => {
    jest.mocked(requestReminderPermission).mockResolvedValue(true);
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Reminders, Off' }));
    await fireEvent.press(screen.getByRole('radio', { name: '3 days before' }));
    await fireEvent.press(screen.getByRole('switch', { name: 'Remind me' }));

    expect(useSettings.getState()).toMatchObject({ remindersEnabled: true, reminderLead: 'threeDays' });
    expect(screen.getByRole('button', { name: 'Reminders, 3 days before' })).toBeOnTheScreen();
  });

  it('explains when the phone blocks reminders', async () => {
    jest.mocked(requestReminderPermission).mockResolvedValue(false);
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Reminders, Off' }));
    await fireEvent.press(screen.getByRole('switch', { name: 'Remind me' }));

    expect(useSettings.getState().remindersEnabled).toBe(false);
    expect(screen.getByText('Notifications are off for lapse. Turn them on in Settings.')).toBeOnTheScreen();
  });

  it('checks Face ID before turning the lock on', async () => {
    await render(<ProfileScreen />);

    await fireEvent.press(await screen.findByRole('switch', { name: 'Face ID lock' }));

    expect(unlock).toHaveBeenCalledWith('Turn on Face ID lock');
    expect(useSettings.getState().appLock).toBe(true);
  });

  it('leaves the lock off when Face ID fails', async () => {
    jest.mocked(unlock).mockResolvedValue('failed');
    await render(<ProfileScreen />);

    await fireEvent.press(await screen.findByRole('switch', { name: 'Face ID lock' }));

    expect(useSettings.getState().appLock).toBe(false);
  });

  it('can’t turn the lock on before Face ID is set up', async () => {
    jest.mocked(getBiometrics).mockResolvedValue({ ready: false, name: 'Face ID' });
    await render(<ProfileScreen />);

    expect(await screen.findByRole('switch', { name: 'Face ID lock' })).toBeDisabled();
    expect(screen.getByText('Set up on your phone first')).toBeOnTheScreen();
  });

  it('exports the subscriptions as a CSV file', async () => {
    useSubscriptions.setState({
      subscriptions: [{ ...base, id: 'a', name: 'Netflix', priceCents: 1549, chargeOn: '2026-10-22', createdAt: 'x' }],
    });
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Export as CSV' }));

    expect(shareCsv).toHaveBeenCalledWith(
      expect.stringContaining('Netflix,15.49,USD'),
      'lapse-subscriptions-2026-10-16.csv',
    );
  });

  it('has nothing to export with no subscriptions', async () => {
    await render(<ProfileScreen />);

    expect(screen.queryByRole('button', { name: 'Export as CSV' })).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Export as CSV, Nothing yet')).toBeOnTheScreen();
  });

  it('in development, "Show onboarding again" clears onboarding so onboarding comes back', async () => {
    setDev(true);
    useSettings.getState().completeOnboarding(true);
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Show onboarding again' }));

    expect(useSettings.getState()).toMatchObject({ hasOnboarded: false, remindersEnabled: false });
  });

  it('in development, sends a test reminder', async () => {
    setDev(true);
    jest.mocked(sendTestReminder).mockResolvedValue('sent');
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Send a test reminder' }));

    expect(sendTestReminder).toHaveBeenCalledWith([], 'oneDay');
    expect(alert.mock.calls[0][0]).toBe('Test reminder in 5 seconds');
  });

  it('hides "Show onboarding again" in release builds', async () => {
    setDev(false);
    await render(<ProfileScreen />);
    await act(async () => {});

    expect(screen.queryByRole('button', { name: 'Show onboarding again' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Send a test reminder' })).not.toBeOnTheScreen();
  });
});
