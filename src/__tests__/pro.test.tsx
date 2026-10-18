import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { purchasePro, restorePro, usePro } from '@/features/pro/purchase';
import { useSubscriptions } from '@/stores/subscriptions';

import ProScreen from '@/app/pro';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn() } }));
jest.mock('@/features/pro/purchase', () => ({
  ...jest.requireActual('@/features/pro/purchase'),
  purchasePro: jest.fn(),
  restorePro: jest.fn(),
}));

const initial = useSubscriptions.getState();
const base = { serviceId: null, currency: 'USD' as const, cycle: 'month' as const, trial: false, createdAt: 'x' };

beforeAll(() => jest.useFakeTimers({ now: new Date(2026, 9, 16, 9, 0), advanceTimers: true }));
afterAll(() => jest.useRealTimers());
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  useSubscriptions.setState({ ...initial, subscriptions: [] }, true);
  usePro.setState({ isPro: false, price: null });
});

describe('Pro screen', () => {
  it('shows the offer, the features and what you track a year', async () => {
    useSubscriptions.setState({
      subscriptions: [
        { ...base, id: 'a', name: 'Netflix', priceCents: 1549, chargeOn: '2026-10-22' },
        { ...base, id: 'b', name: 'Notion', priceCents: 1000, chargeOn: '2026-10-25' },
      ],
    });
    await render(<ProScreen />);

    expect(screen.getByRole('heading', { name: /Pay once\.\s+Keep it forever\./ })).toBeOnTheScreen();
    expect(screen.getByText(/^You’re tracking \$306 a year\./)).toBeOnTheScreen();
    expect(screen.getByLabelText('Statement import, CSV or PDF')).toBeOnTheScreen();
    expect(screen.getByLabelText('Stays on device, Nothing uploaded')).toBeOnTheScreen();
  });

  it('leaves out the yearly total with nothing tracked', async () => {
    await render(<ProScreen />);
    expect(screen.getByText('Pro pays for itself the first time it catches a forgotten charge.')).toBeOnTheScreen();
  });

  it('says Pro isn’t on sale yet while the store is unavailable', async () => {
    jest.mocked(purchasePro).mockResolvedValue('unavailable');
    await render(<ProScreen />);

    await fireEvent.press(screen.getByRole('button', { name: /^Unlock Pro · \$14\.99/ }));

    expect(jest.mocked(Alert.alert).mock.calls[0][0]).toBe('Pro isn’t on sale yet');
  });

  it('closes once Pro is unlocked, and stays put when the purchase is cancelled', async () => {
    const router = jest.requireMock('expo-router').router;
    jest.mocked(purchasePro).mockResolvedValueOnce('cancelled').mockResolvedValueOnce('unlocked');
    await render(<ProScreen />);

    await fireEvent.press(screen.getByRole('button', { name: /^Unlock Pro/ }));
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: /^Unlock Pro/ }));
    expect(jest.mocked(Alert.alert).mock.calls[0][0]).toBe('Pro is unlocked');
    expect(router.back).toHaveBeenCalled();
  });

  it('closes once, even on a double tap', async () => {
    const router = jest.requireMock('expo-router').router;
    await render(<ProScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('shows cents for a total under a dollar a year', async () => {
    useSubscriptions.setState({
      subscriptions: [{ ...base, id: 'a', name: 'Tiny', priceCents: 50, cycle: 'year', chargeOn: '2026-10-22' }],
    });
    await render(<ProScreen />);

    expect(screen.getByText(/^You’re tracking \$0\.50 a year\./)).toBeOnTheScreen();
  });

  it('restores, and explains a store error', async () => {
    jest.mocked(restorePro).mockRejectedValue(new Error('offline'));
    await render(<ProScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Restore purchase' }));

    expect(jest.mocked(Alert.alert).mock.calls[0][0]).toBe('Something went wrong');
  });

  it('shows the store’s price in the phone’s currency once it is known', async () => {
    usePro.setState({ price: '₹1,299.00' });
    await render(<ProScreen />);

    expect(screen.getByRole('button', { name: /^Unlock Pro · ₹1,299\.00/ })).toBeOnTheScreen();
  });

  it('says when a restore finds no Pro purchase', async () => {
    jest.mocked(restorePro).mockResolvedValue('nothing');
    await render(<ProScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Restore purchase' }));

    expect(jest.mocked(Alert.alert).mock.calls[0][0]).toBe('No Pro purchase found');
  });

  it('thanks someone who already has Pro instead of selling it again', async () => {
    usePro.setState({ isPro: true });
    await render(<ProScreen />);

    expect(screen.getByText('You have Pro. Thank you!')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Unlock Pro/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Restore purchase' })).toBeNull();
  });
});
