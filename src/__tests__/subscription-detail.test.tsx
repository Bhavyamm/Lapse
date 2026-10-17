import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

import { useSubscriptions } from '@/stores/subscriptions';

import SubscriptionScreen from '@/app/subscription/[id]';

const mockParams = { id: 'n' };
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));

const initial = useSubscriptions.getState();
const base = { currency: 'USD' as const, createdAt: '2026-10-01T09:00:00.000Z', trial: false, cycle: 'month' as const };
const netflix = { ...base, id: 'n', serviceId: 'netflix', name: 'Netflix', priceCents: 1549, chargeOn: '2026-10-22' };

beforeAll(() => jest.useFakeTimers({ now: new Date(2026, 9, 16, 9, 0), advanceTimers: true }));
afterAll(() => jest.useRealTimers());
beforeEach(() => {
  mockParams.id = 'n';
  useSubscriptions.setState({ ...initial, subscriptions: [netflix], cancelled: [] }, true);
});
afterEach(() => jest.restoreAllMocks());

describe('Subscription detail', () => {
  it('shows the price, renewal and how to cancel', async () => {
    await render(<SubscriptionScreen />);

    expect(screen.getByRole('heading', { name: 'Netflix' })).toBeOnTheScreen();
    expect(screen.getByText('Renews Thu, Oct 22')).toBeOnTheScreen();
    expect(screen.getByLabelText('$15.49 a month')).toBeOnTheScreen();
    expect(screen.getByLabelText('Per year: $185.88')).toBeOnTheScreen();
    expect(screen.getByText('Tap Cancel Membership, then Finish Cancellation.')).toBeOnTheScreen();
  });

  it('opens the cancel page', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<SubscriptionScreen />);

    await fireEvent.press(screen.getByRole('link', { name: 'Open Netflix cancel page' }));

    expect(open).toHaveBeenCalledWith('https://www.netflix.com/cancelplan');
  });

  it('marks it cancelled after confirming', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[1].onPress?.());
    await render(<SubscriptionScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'I already cancelled' }));

    const state = useSubscriptions.getState();
    expect(state.subscriptions).toEqual([]);
    expect(state.cancelled[0]).toMatchObject({ id: 'n', savedFrom: '2026-10-22' });
  });

  it('keeps it when the person says not now', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[0].onPress?.());
    await render(<SubscriptionScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'I already cancelled' }));

    expect(useSubscriptions.getState().subscriptions).toHaveLength(1);
  });

  it('turns the renewal alert off and on', async () => {
    await render(<SubscriptionScreen />);
    const toggle = screen.getByRole('switch', { name: 'Renewal alert' });

    await fireEvent.press(toggle);
    expect(useSubscriptions.getState().subscriptions[0].remind).toBe(false);
    await fireEvent.press(toggle);
    expect(useSubscriptions.getState().subscriptions[0].remind).toBe(true);
  });

  it('edits the price', async () => {
    await render(<SubscriptionScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Edit details for Netflix' }));
    await fireEvent.changeText(screen.getByLabelText('Price'), '17.99');
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(useSubscriptions.getState().subscriptions[0].priceCents).toBe(1799);
    expect(screen.getByLabelText('$17.99 a month')).toBeOnTheScreen();
  });

  it('says so when the subscription is gone', async () => {
    mockParams.id = 'missing';
    await render(<SubscriptionScreen />);

    expect(screen.getByText('Not tracked any more')).toBeOnTheScreen();
  });

  it('shows a running trial as ending', async () => {
    useSubscriptions.setState({
      subscriptions: [
        { ...netflix, serviceId: 'duolingo-max', name: 'Duolingo Max', trial: true, chargeOn: '2026-10-18' },
      ],
    });
    await render(<SubscriptionScreen />);

    expect(screen.getByText('Trial ends Sun, Oct 18')).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'Open App Store subscriptions' })).toBeOnTheScreen();
  });
});

describe('Subscription detail editing', () => {
  beforeEach(() => useSubscriptions.setState({ ...initial, subscriptions: [netflix], cancelled: [] }, true));

  it('keeps the renewal date when the cycle changes', async () => {
    await render(<SubscriptionScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Edit details for Netflix' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Yearly' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(useSubscriptions.getState().subscriptions[0]).toMatchObject({ cycle: 'year', chargeOn: '2026-10-22' });
  });

  it('keeps showing the subscription while leaving after a cancel', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[1].onPress?.());
    await render(<SubscriptionScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'I already cancelled' }));

    expect(screen.queryByText('Not tracked any more')).not.toBeOnTheScreen();
  });

  it('says when a link can’t open', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no handler'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await render(<SubscriptionScreen />);

    await fireEvent.press(screen.getByRole('link', { name: 'Open Netflix cancel page' }));

    expect(alert).toHaveBeenCalledWith('Couldn’t open the link', expect.any(String));
  });
});
