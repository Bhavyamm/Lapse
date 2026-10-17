import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { useSubscriptions } from '@/stores/subscriptions';

import AddScreen from '@/app/add';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) },
}));

const initial = useSubscriptions.getState();

beforeAll(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 17, 9, 0), advanceTimers: true });
});
afterAll(() => jest.useRealTimers());
beforeEach(() => {
  jest.clearAllMocks();
  useSubscriptions.setState(initial, true);
});

const search = (text: string) => fireEvent.changeText(screen.getByLabelText('Search services'), text);
const saved = () => useSubscriptions.getState().subscriptions;

describe('Add a subscription', () => {
  it('lists popular services and keeps the save button off until one is picked', async () => {
    await render(<AddScreen />);

    expect(screen.getByText('Popular')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Add Netflix, From \$7\.99 a month/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add and remind me' })).toBeDisabled();
  });

  it('filters the list as the person types', async () => {
    await render(<AddScreen />);

    await search('spo');

    expect(screen.getByText('Results')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Add Spotify/ })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Add Netflix/ })).not.toBeOnTheScreen();
  });

  it('says when nothing matches and offers to add it by hand', async () => {
    await render(<AddScreen />);

    await search('Gym');

    expect(screen.getByText('No match for “Gym”')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add “Gym” yourself' })).toBeOnTheScreen();
  });

  it('saves the picked services and goes back', async () => {
    await render(<AddScreen />);

    await fireEvent.press(screen.getByRole('button', { name: /^Add Spotify/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Add Netflix/ }));
    expect(screen.getAllByText('Tue, Nov 17')).toHaveLength(2);
    await fireEvent.press(screen.getByRole('button', { name: 'Add 2 and remind me' }));

    expect(saved().map((s) => [s.name, s.priceCents, s.chargeOn])).toEqual([
      ['Spotify', 1199, '2026-11-17'],
      ['Netflix', 799, '2026-11-17'],
    ]);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('lets a pick be removed before saving', async () => {
    await render(<AddScreen />);

    await fireEvent.press(screen.getByRole('button', { name: /^Add Spotify/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Remove Spotify' }));

    expect(screen.getByRole('button', { name: /^Add Spotify/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add and remind me' })).toBeDisabled();
  });

  it('saves the price, how often and trial chosen in the editor', async () => {
    await render(<AddScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Add Netflix/ }));

    await fireEvent.press(screen.getByRole('button', { name: 'Change Netflix' }));
    await fireEvent.changeText(screen.getByLabelText('Price'), '15.49');
    await fireEvent.press(screen.getByRole('radio', { name: 'Yearly' }));
    await fireEvent.press(screen.getByRole('switch', { name: 'Free trial' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Sat, Oct 31' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Free trial, then $15.49 a year')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Add and remind me' }));
    expect(saved()[0]).toMatchObject({ priceCents: 1549, cycle: 'year', trial: true, chargeOn: '2026-10-31' });
  });

  it('does not allow a date before today', async () => {
    await render(<AddScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Add Netflix/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Change Netflix' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));

    expect(screen.getByRole('radio', { name: 'Fri, Oct 16' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Sat, Oct 17' })).toBeEnabled();
  });

  it('adds a custom subscription only once it has a price', async () => {
    await render(<AddScreen />);
    await search('Gym');
    await fireEvent.press(screen.getByRole('button', { name: 'Add “Gym” yourself' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Add a price, like 9.99.');

    await fireEvent.changeText(screen.getByLabelText('Price'), '40');
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add and remind me' }));

    expect(saved()[0]).toMatchObject({ serviceId: null, name: 'Gym', priceCents: 4000, cycle: 'month' });
  });

  it('saves once even if the button is pressed twice', async () => {
    await render(<AddScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Add Spotify/ }));

    const button = screen.getByRole('button', { name: 'Add and remind me' });
    await fireEvent.press(button);
    await fireEvent.press(button);

    expect(saved()).toHaveLength(1);
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
