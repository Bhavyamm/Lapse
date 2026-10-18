import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { getBiometrics, unlock } from '@/features/lock/biometrics';
import { usePro } from '@/features/pro/purchase';
import { requestReminderPermission } from '@/features/reminders/permissions';
import { shareCsv } from '@/features/subscriptions/export';
import { useSettings } from '@/stores/settings';
import { useSubscriptions } from '@/stores/subscriptions';

import ProfileScreen from '@/app/(tabs)/profile';

jest.mock('@/features/lock/biometrics', () => ({ getBiometrics: jest.fn(), unlock: jest.fn() }));
jest.mock('@/features/reminders/permissions', () => ({ requestReminderPermission: jest.fn() }));
jest.mock('@/features/subscriptions/export', () => ({ shareCsv: jest.fn() }));
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

  it('shows the Pro plan and no upsell once Pro is owned', async () => {
    usePro.setState({ isPro: true });
    await render(<ProfileScreen />);

    expect(screen.getByText('Pro · Data stays on this phone')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Unlock Pro/ })).toBeNull();
    usePro.setState({ isPro: false });
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

  it('clears all data after asking, and goes back to a fresh start', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[1].onPress?.());
    useSettings.getState().completeOnboarding(true);
    useSettings.getState().setAppLock(true);
    useSubscriptions.getState().add([{ ...base, name: 'Gym', priceCents: 4000, chargeOn: '2026-10-20' }]);
    useSubscriptions.getState().cancel(useSubscriptions.getState().subscriptions[0].id, '2026-10-16');
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Clear all data' }));

    expect(alert).toHaveBeenCalledWith(
      'Clear all your data?',
      expect.any(String),
      [
        expect.objectContaining({ text: 'Keep my data', style: 'cancel' }),
        expect.objectContaining({ text: 'Clear everything', style: 'destructive' }),
      ],
      expect.anything(),
    );
    expect(useSubscriptions.getState()).toMatchObject({ subscriptions: [], cancelled: [] });
    expect(useSettings.getState()).toMatchObject({ hasOnboarded: false, remindersEnabled: false, appLock: false });
  });

  it('keeps everything when the person backs out of clearing', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[0].onPress?.());
    useSettings.getState().completeOnboarding(true);
    useSubscriptions.getState().add([{ ...base, name: 'Gym', priceCents: 4000, chargeOn: '2026-10-20' }]);
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Clear all data' }));

    expect(useSubscriptions.getState().subscriptions).toHaveLength(1);
    expect(useSettings.getState().hasOnboarded).toBe(true);
  });

  it('has no developer buttons, even in development', async () => {
    setDev(true);
    await render(<ProfileScreen />);
    await act(async () => {});

    expect(screen.queryByRole('button', { name: 'Show onboarding again' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Send a test reminder' })).not.toBeOnTheScreen();
  });
});
