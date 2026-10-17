import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useSubscriptions } from '@/stores/subscriptions';

import CheckInScreen from '@/app/check-in';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() },
}));

const initial = useSubscriptions.getState();
const base = {
  serviceId: null,
  currency: 'USD' as const,
  cycle: 'month' as const,
  trial: false,
  createdAt: '2026-08-01T09:00:00.000Z',
};
const gpt = { ...base, id: 'gpt', name: 'ChatGPT', priceCents: 2000, chargeOn: '2026-10-24' };
const yt = {
  ...base,
  id: 'yt',
  name: 'YouTube Premium',
  priceCents: 1399,
  chargeOn: '2026-10-22',
  reviewedOn: '2026-09-16',
};
const router = () => jest.requireMock('expo-router').router;

beforeAll(() => jest.useFakeTimers({ now: new Date(2026, 9, 16, 9, 0), advanceTimers: true }));
afterAll(() => jest.useRealTimers());
afterEach(() => jest.restoreAllMocks());
beforeEach(() => {
  jest.clearAllMocks();
  useSubscriptions.setState({ ...initial, subscriptions: [yt, gpt], cancelled: [] }, true);
});

describe('Monthly check-in', () => {
  it('shows one subscription at a time with its yearly cost', async () => {
    await render(<CheckInScreen />);

    expect(screen.getByRole('heading', { name: 'Still using this?' })).toBeOnTheScreen();
    expect(screen.getByText('1 of 2')).toBeOnTheScreen();
    expect(screen.getByLabelText('ChatGPT, $240.00 a year. Added Aug 1')).toBeOnTheScreen();
    expect(screen.getByText(/\$20\.00 a month\. Cancelling would save you that every year\./)).toBeOnTheScreen();
  });

  it('counts savings so far when there are some', async () => {
    useSubscriptions.setState({
      cancelled: [
        {
          ...base,
          id: 'h',
          name: 'Hulu',
          priceCents: 1000,
          chargeOn: '2026-09-10',
          cancelledOn: '2026-09-01',
          savedFrom: '2026-09-10',
        },
      ],
    });
    await render(<CheckInScreen />);

    expect(screen.getByText(/bring your savings to \$260\.00 a year from now/)).toBeOnTheScreen();
  });

  it('keeps one, leaves one for next month, then sums up', async () => {
    await render(<CheckInScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Keep it' }));
    expect(useSubscriptions.getState().subscriptions.find((s) => s.id === 'gpt')?.reviewedOn).toBe('2026-10-16');
    expect(screen.getByText('2 of 2')).toBeOnTheScreen();
    expect(screen.getByLabelText(/YouTube Premium, .* Last reviewed Sep 16/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    expect(useSubscriptions.getState().subscriptions.find((s) => s.id === 'yt')).toMatchObject({
      reviewedOn: '2026-09-16',
      skippedOn: '2026-10-16',
    });
    expect(await screen.findByRole('heading', { name: 'All checked' })).toBeOnTheScreen();
    expect(screen.getByText('You kept 1 and left 1 for next month. See you next month.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(router().back).toHaveBeenCalled();
  });

  it('opens the cancel steps, and moves on once it is cancelled there', async () => {
    const view = await render(<CheckInScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Cancel it' }));
    expect(router().push).toHaveBeenCalledWith({ pathname: '/subscription/[id]', params: { id: 'gpt' } });

    useSubscriptions.getState().cancel('gpt', '2026-10-16');
    await view.rerender(<CheckInScreen />);

    expect(screen.getByText('2 of 2')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Keep it' }));
    expect(await screen.findByText('You kept 1 and cancelled 1. See you next month.')).toBeOnTheScreen();
    expect(screen.getByText('You’ll save')).toBeOnTheScreen();
    expect(screen.getByLabelText('$240.00 a year')).toBeOnTheScreen();
    expect(screen.getByLabelText('ChatGPT, $240.00 a year. Cancelled')).toBeOnTheScreen();
    expect(screen.getByLabelText(/YouTube Premium, .* a year\. Kept/)).toBeOnTheScreen();
  });

  it('doesn’t count one deleted rather than cancelled', async () => {
    const view = await render(<CheckInScreen />);
    useSubscriptions.getState().remove('gpt');
    await view.rerender(<CheckInScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Keep it' }));

    expect(await screen.findByText('You kept 1. See you next month.')).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^ChatGPT/)).toBeNull();
  });

  it('swipes the answered card away while the next one comes in', async () => {
    await render(<CheckInScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Keep it' }));

    expect(screen.queryByLabelText(/ChatGPT/)).toBeNull();
    expect(screen.getByLabelText(/YouTube Premium/)).toBeOnTheScreen();
    await waitFor(() => expect(screen.queryByLabelText(/ChatGPT/, { includeHiddenElements: true })).toBeNull());
  });

  it('shows what was kept, with a total, once all are checked', async () => {
    await render(<CheckInScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Keep it' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Keep it' }));

    expect(await screen.findByText('Still worth it')).toBeOnTheScreen();
    expect(screen.getByText('On the 2 you kept')).toBeOnTheScreen();
    expect(screen.getByLabelText('2 Kept')).toBeOnTheScreen();
    expect(screen.getByLabelText('0 Cancelled')).toBeOnTheScreen();
  });

  it('skips the swipe with Reduce Motion on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await render(<CheckInScreen />);
    await act(async () => {});
    await fireEvent.press(screen.getByRole('button', { name: 'Keep it' }));
    expect(screen.queryByLabelText(/ChatGPT/, { includeHiddenElements: true })).toBeNull();
  });

  it('says there’s nothing to check with no subscriptions', async () => {
    useSubscriptions.setState({ subscriptions: [] });
    await render(<CheckInScreen />);

    expect(screen.getByRole('heading', { name: 'Nothing to check' })).toBeOnTheScreen();
  });
});
