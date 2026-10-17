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
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/subscription/[id]', params: { id: 'd' } });

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
});
