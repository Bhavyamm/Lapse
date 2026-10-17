import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { useSubscriptions } from '@/stores/subscriptions';

import SubscriptionsScreen from '@/app/(tabs)/subscriptions';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const initial = useSubscriptions.getState();
const base = { currency: 'USD' as const, createdAt: '2026-10-01T00:00:00.000Z', trial: false, cycle: 'month' as const };
const subs = [
  { ...base, id: 'a', serviceId: 'netflix', name: 'Netflix', priceCents: 1549, chargeOn: '2026-10-22' },
  { ...base, id: 'b', serviceId: 'icloud', name: 'iCloud+', priceCents: 299, chargeOn: '2026-10-19' },
  { ...base, id: 'c', serviceId: 'spotify', name: 'Spotify', priceCents: 1199, chargeOn: '2026-11-02' },
  {
    ...base,
    id: 'd',
    serviceId: 'duolingo-max',
    name: 'Duolingo Max',
    priceCents: 2999,
    chargeOn: '2026-10-18',
    trial: true,
  },
];

beforeAll(() => jest.useFakeTimers({ now: new Date(2026, 9, 17, 9, 0), advanceTimers: true }));
afterAll(() => jest.useRealTimers());
beforeEach(() => {
  jest.clearAllMocks();
  useSubscriptions.setState(initial, true);
});

const rowNames = () => screen.getAllByText(/^(Netflix|iCloud\+|Spotify)$/).map((n) => n.props.children);

describe('All subscriptions', () => {
  it('offers to add one when nothing is tracked', async () => {
    await render(<SubscriptionsScreen />);

    expect(screen.getByText('Nothing tracked yet')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Add a subscription' }));
    expect(router.push).toHaveBeenCalledWith('/add');
  });

  it('shows the count and monthly total, with trials on top', async () => {
    useSubscriptions.setState({ subscriptions: subs });
    await render(<SubscriptionsScreen />);

    expect(screen.getByText('4 tracked · $30.47 a month')).toBeOnTheScreen();
    expect(screen.getByText('Free trial · then $29.99 a month')).toBeOnTheScreen();
    expect(screen.getByText('Ends Oct 18')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Next renewal' })).toBeChecked();
    expect(rowNames()).toEqual(['iCloud+', 'Netflix', 'Spotify']);
    expect(screen.getByText('Oct 19')).toBeOnTheScreen();
  });

  it('re-sorts by price and by name', async () => {
    useSubscriptions.setState({ subscriptions: subs });
    await render(<SubscriptionsScreen />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Price' }));
    expect(rowNames()).toEqual(['Netflix', 'Spotify', 'iCloud+']);

    await fireEvent.press(screen.getByRole('radio', { name: 'Name' }));
    expect(rowNames()).toEqual(['iCloud+', 'Netflix', 'Spotify']);
    expect(screen.getByRole('radio', { name: 'Name' })).toBeChecked();
  });
});
