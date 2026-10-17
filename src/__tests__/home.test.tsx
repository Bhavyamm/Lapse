import { render, screen } from '@testing-library/react-native';

import { useSubscriptions } from '@/stores/subscriptions';

import HomeScreen from '@/app/(tabs)/index';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const initial = useSubscriptions.getState();
const base = { currency: 'USD' as const, createdAt: '2026-10-01T00:00:00.000Z', trial: false, cycle: 'month' as const };

beforeAll(() => jest.useFakeTimers({ now: new Date(2026, 9, 17, 9, 0), advanceTimers: true }));
afterAll(() => jest.useRealTimers());
beforeEach(() => useSubscriptions.setState(initial, true));

describe('Home', () => {
  it('shows the empty state with no subscriptions', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('What do you pay for?')).toBeOnTheScreen();
    expect(screen.queryByText('Coming up')).not.toBeOnTheScreen();
  });

  it('lists subscriptions soonest first, rolling past dates forward', async () => {
    useSubscriptions.setState({
      subscriptions: [
        { ...base, id: 'a', serviceId: 'netflix', name: 'Netflix', priceCents: 1549, chargeOn: '2026-10-22' },
        { ...base, id: 'b', serviceId: 'spotify', name: 'Spotify', priceCents: 1199, chargeOn: '2026-09-19' },
        { ...base, id: 'c', serviceId: null, name: 'Gym', priceCents: 4000, chargeOn: '2026-12-01', trial: true },
      ],
    });
    await render(<HomeScreen />);

    expect(screen.getByText('Coming up')).toBeOnTheScreen();
    const names = screen.getAllByText(/^(Netflix|Spotify|Gym)$/).map((n) => n.props.children);
    expect(names).toEqual(['Spotify', 'Netflix', 'Gym']);
    expect(screen.getByText('Mon, Oct 19')).toBeOnTheScreen();
    expect(screen.getByText('Free trial ends')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add a subscription' })).toBeOnTheScreen();
  });
});
