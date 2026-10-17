import { fireEvent, render, screen } from '@testing-library/react-native';

import { useSubscriptions } from '@/stores/subscriptions';

import CalendarScreen from '@/app/(tabs)/calendar';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const initial = useSubscriptions.getState();
const base = { currency: 'USD' as const, createdAt: '2026-10-01T00:00:00.000Z', trial: false, cycle: 'month' as const };

beforeAll(() => jest.useFakeTimers({ now: new Date(2026, 9, 17, 9, 0), advanceTimers: true }));
afterAll(() => jest.useRealTimers());
beforeEach(() => useSubscriptions.setState(initial, true));

const seed = () =>
  useSubscriptions.setState({
    subscriptions: [
      { ...base, id: 'a', serviceId: 'netflix', name: 'Netflix', priceCents: 1549, chargeOn: '2026-10-22' },
      { ...base, id: 'b', serviceId: 'chatgpt-plus', name: 'ChatGPT', priceCents: 2000, chargeOn: '2026-11-08' },
      {
        ...base,
        id: 'c',
        serviceId: 'duolingo-max',
        name: 'Duolingo Max',
        priceCents: 2999,
        chargeOn: '2026-10-18',
        trial: true,
      },
    ],
  });

describe('Calendar', () => {
  it('shows what is left to pay this month and the next charges', async () => {
    seed();
    await render(<CalendarScreen />);

    expect(screen.getByText('October')).toBeOnTheScreen();
    expect(screen.getByText('$45.48 still to pay this month')).toBeOnTheScreen();
    expect(screen.getByText('Coming up')).toBeOnTheScreen();
    expect(screen.getByText('Trial ends')).toBeOnTheScreen();
    expect(screen.queryByText('ChatGPT')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Sun, Oct 18, Duolingo Max trial ends, then $29.99')).toBeOnTheScreen();
    expect(screen.getByLabelText('Today, Sat, Oct 17')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
  });

  it('moves to next month and back', async () => {
    seed();
    await render(<CalendarScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('November')).toBeOnTheScreen();
    expect(screen.getByText('$65.48 due in November')).toBeOnTheScreen();
    expect(screen.getByText('First in November')).toBeOnTheScreen();
    expect(screen.getByLabelText('Sun, Nov 8, ChatGPT $20.00')).toBeOnTheScreen();
    expect(screen.queryByText('Trial ends')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('October')).toBeOnTheScreen();
  });

  it('stops eleven months ahead and names the year once it changes', async () => {
    await render(<CalendarScreen />);

    for (let i = 0; i < 11; i++) await fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('September 2027')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it('points to Add when nothing is tracked', async () => {
    await render(<CalendarScreen />);

    expect(screen.getByText('Nothing left to pay this month')).toBeOnTheScreen();
    expect(screen.getByText('Add a subscription to see its renewals here.')).toBeOnTheScreen();
  });
});

describe('Calendar when a month has many charges', () => {
  it('says how many more charges the list leaves out', async () => {
    useSubscriptions.setState({
      subscriptions: ['A', 'B', 'C', 'D', 'E', 'F'].map((name, i) => ({
        ...base,
        id: name,
        serviceId: null,
        name,
        priceCents: 100,
        chargeOn: `2026-10-2${i}`,
      })),
    });
    await render(<CalendarScreen />);

    expect(screen.getByText('2 more this month')).toBeOnTheScreen();
    expect(screen.getByLabelText('October 2026 renewals')).toBeOnTheScreen();
  });
});
