import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { useSettings } from '@/stores/settings';
import { useSubscriptions } from '@/stores/subscriptions';

import TrialScreen from '@/app/trial/[id]';

const mockParams = { id: 'd' };
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn(), push: jest.fn() },
    useLocalSearchParams: () => mockParams,
    Redirect: ({ href }: { href: { pathname: string } }) => <Text>redirect {href.pathname}</Text>,
  };
});

const initialSubs = useSubscriptions.getState();
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

beforeAll(() => jest.useFakeTimers({ now: new Date(2026, 9, 16, 8, 0), advanceTimers: true }));
afterAll(() => jest.useRealTimers());
beforeEach(() => {
  jest.clearAllMocks();
  useSubscriptions.setState({ ...initialSubs, subscriptions: [duo], cancelled: [] }, true);
  useSettings.setState({ ...initialSettings, remindersEnabled: true, reminderLead: 'oneDay' }, true);
});

describe('Trial screen', () => {
  it('counts down and says what it costs after', async () => {
    await render(<TrialScreen />);

    expect(screen.getByRole('heading', { name: '2 days left' })).toBeOnTheScreen();
    expect(screen.getByText('Your Duolingo Max trial ends Sunday. After that it’s $29.99 a month.')).toBeOnTheScreen();
    expect(screen.getByLabelText('First charge: Sun, Oct 18')).toBeOnTheScreen();
    expect(screen.getByLabelText('If you keep it: $359.88/yr')).toBeOnTheScreen();
    expect(screen.getByText(/^Sat, 9:00/)).toBeOnTheScreen();
  });

  it('sets this trial’s reminder timing', async () => {
    await render(<TrialScreen />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Morning of' }));

    expect(useSubscriptions.getState().subscriptions[0].lead).toBe('morningOf');
    expect(useSettings.getState().reminderLead).toBe('oneDay');
    expect(screen.getByText(/^Sun, 9:00/)).toBeOnTheScreen();
  });

  it('says when the reminder time has passed or reminders are off', async () => {
    useSubscriptions.setState({ subscriptions: [{ ...duo, lead: 'threeDays' }] });
    const view = await render(<TrialScreen />);
    expect(screen.getByText('That time has passed')).toBeOnTheScreen();

    await act(async () => useSettings.setState({ remindersEnabled: false }));
    await view.rerender(<TrialScreen />);
    expect(screen.getByText('Reminders are off')).toBeOnTheScreen();
  });

  it('goes to the cancel steps, or closes to keep it', async () => {
    const mockRouter = jest.requireMock('expo-router').router;
    await render(<TrialScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Cancel before Sunday' }));
    // Replaces the trial screen, so leaving the detail never lands back on a stale trial.
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/subscription/[id]', params: { id: 'd' } });
    expect(mockRouter.push).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'I’ll keep it' }));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('says today on the last day', async () => {
    useSubscriptions.setState({ subscriptions: [{ ...duo, chargeOn: '2026-10-16' }] });
    await render(<TrialScreen />);

    expect(screen.getByRole('heading', { name: 'Today' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Cancel it now' })).toBeOnTheScreen();
  });

  it('hands over to the detail screen once the trial is over', async () => {
    useSubscriptions.setState({ subscriptions: [{ ...duo, chargeOn: '2026-10-10' }] });
    await render(<TrialScreen />);

    expect(screen.getByText('redirect /subscription/[id]')).toBeOnTheScreen();
  });

  it('names the date for a trial a week or more away', async () => {
    useSubscriptions.setState({ subscriptions: [{ ...duo, chargeOn: '2026-10-25' }] });
    await render(<TrialScreen />);

    expect(screen.getByRole('button', { name: 'Cancel before Sun, Oct 25' })).toBeOnTheScreen();
    expect(screen.getByText(/trial ends on Sun, Oct 25\./)).toBeOnTheScreen();
  });

  it('says today’s reminder has passed once its time is gone', async () => {
    jest.setSystemTime(new Date(2026, 9, 17, 14, 0));
    try {
      await render(<TrialScreen />);
      expect(screen.getByText('That time has passed')).toBeOnTheScreen();
    } finally {
      jest.setSystemTime(new Date(2026, 9, 16, 8, 0));
    }
  });

  it('turns a trial’s reminder back on when a time is picked', async () => {
    useSubscriptions.setState({ subscriptions: [{ ...duo, remind: false }] });
    await render(<TrialScreen />);
    expect(screen.getByText('Off for this trial. Pick a time to turn it on.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Morning of' }));

    expect(useSubscriptions.getState().subscriptions[0]).toMatchObject({ remind: true, lead: 'morningOf' });
  });

  it('hides the timing choices while reminders are off', async () => {
    useSettings.setState({ remindersEnabled: false });
    await render(<TrialScreen />);

    expect(screen.queryByRole('radio', { name: 'Morning of' })).not.toBeOnTheScreen();
  });

  it('hands over to the detail screen when the subscription is gone', async () => {
    useSubscriptions.setState({ subscriptions: [] });
    await render(<TrialScreen />);

    expect(screen.getByText('redirect /subscription/[id]')).toBeOnTheScreen();
  });
});
