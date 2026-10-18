import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import { usePro } from '@/features/pro/purchase';
import { useSubscriptions } from '@/stores/subscriptions';

import AddScreen from '@/app/add';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: jest.fn(() => true) },
  useNavigation: () => ({ dispatch: jest.fn() }),
}));

const initial = useSubscriptions.getState();

beforeAll(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 17, 9, 0), advanceTimers: true });
});
afterAll(() => jest.useRealTimers());
beforeEach(() => {
  jest.clearAllMocks();
  useSubscriptions.setState(initial, true);
  usePro.setState({ isPro: false });
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
    expect(screen.getByRole('button', { name: /^Change Spotify,/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Change Netflix,/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Change Spotify, $11.99 a month' })).toBeOnTheScreen();
    expect(screen.getByText('2 picked · $19.98 a month')).toBeOnTheScreen();
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

  it('keeps a picked service in place, marked, and unpicks it on a second tap', async () => {
    await render(<AddScreen />);

    await fireEvent.press(screen.getByRole('button', { name: /^Add Spotify/ }));
    expect(screen.getByRole('button', { name: /^Remove Spotify, picked/ })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /^Remove Spotify, picked/ }));

    expect(screen.getByRole('button', { name: /^Add Spotify/ })).toBeOnTheScreen();
    expect(screen.queryByText(/picked ·/)).toBeNull();
  });

  it('removes a pick from its chip in the tray', async () => {
    await render(<AddScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Add Spotify/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Add Netflix/ }));
    expect(screen.getByText('2 picked · $19.98 a month')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Remove Netflix' }));
    expect(screen.getByText('1 picked · $11.99 a month')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Add Netflix/ })).toBeOnTheScreen();
  });

  it('asks before discarding edits, then opens the editor fresh', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[1].onPress?.());
    await render(<AddScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Add Netflix/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Change Netflix,/ }));
    await fireEvent.changeText(screen.getByLabelText('Price'), '99');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Close' }).at(-1)!);

    expect(alert).toHaveBeenCalledWith(
      'Discard changes?',
      expect.any(String),
      [
        expect.objectContaining({ text: 'Keep editing', style: 'cancel' }),
        expect.objectContaining({ text: 'Discard changes', style: 'destructive' }),
      ],
      expect.anything(),
    );
    await fireEvent.press(screen.getByRole('button', { name: /^Change Netflix,/ }));
    expect(screen.getAllByLabelText('Price').at(-1)).toHaveDisplayValue('7.99');
    alert.mockRestore();
  });

  it('keeps the edits when the person picks Keep editing', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[0].onPress?.());
    await render(<AddScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Add Netflix/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Change Netflix,/ }));
    await fireEvent.changeText(screen.getByLabelText('Price'), '99');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Close' }).at(-1)!);

    expect(screen.getByLabelText('Price')).toHaveDisplayValue('99');
    alert.mockRestore();
  });

  it('closes an unchanged editor without asking', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    await render(<AddScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Add Netflix/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Change Netflix,/ }));
    await fireEvent.press(screen.getAllByRole('button', { name: 'Close' }).at(-1)!);

    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  it('asks before Back throws away picks', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[0].onPress?.());
    await render(<AddScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Add Netflix/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Add Spotify/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(alert).toHaveBeenCalledWith('Discard 2 picks?', expect.any(String), expect.any(Array), expect.anything());
    expect(router.back).not.toHaveBeenCalled();

    alert.mockImplementation((_t, _m, buttons) => buttons?.[1].onPress?.());
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(router.back).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });

  it('leaves straight away when nothing is picked', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    await render(<AddScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(alert).not.toHaveBeenCalled();
    expect(router.back).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });

  it('saves the price, how often and trial chosen in the editor', async () => {
    await render(<AddScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Add Netflix/ }));

    await fireEvent.press(screen.getByRole('button', { name: /^Change Netflix,/ }));
    await fireEvent.changeText(screen.getByLabelText('Price'), '15.49');
    await fireEvent.press(screen.getByRole('switch', { name: 'Free trial' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Yearly' }));
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
    await fireEvent.press(screen.getByRole('button', { name: /^Change Netflix,/ }));
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
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');

    await fireEvent.changeText(screen.getByLabelText('Price'), '40');
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add and remind me' }));

    expect(saved()[0]).toMatchObject({ serviceId: null, name: 'Gym', priceCents: 4000, cycle: 'month' });
    expect(Haptics.notificationAsync).toHaveBeenLastCalledWith('success');
  });

  it('moves the default date with the cycle until a date is picked', async () => {
    await render(<AddScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /^Add Spotify/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Change Spotify,/ }));

    await fireEvent.press(screen.getByRole('radio', { name: 'Weekly' }));
    expect(screen.getByRole('radio', { name: 'Sat, Oct 24' })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Thu, Oct 29' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Yearly' }));
    expect(screen.getByRole('radio', { name: 'Thu, Oct 29' })).toBeChecked();
  });

  it('shows services already saved as added, and they can’t be picked again', async () => {
    useSubscriptions.getState().add([
      {
        serviceId: 'netflix',
        name: 'Netflix',
        priceCents: 799,
        cycle: 'month',
        chargeOn: '2026-11-17',
        trial: false,
      },
    ]);
    await render(<AddScreen />);

    expect(screen.getByLabelText('Netflix, already added')).toBeDisabled();
    expect(screen.getByText('Added')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Add Netflix/ })).toBeNull();
    await fireEvent.press(screen.getByLabelText('Netflix, already added'));
    expect(screen.queryByText(/picked ·/)).toBeNull();
  });

  it('shows Popular, not Results, for a query of only symbols', async () => {
    await render(<AddScreen />);

    await search('!!');

    expect(screen.getByText('Popular')).toBeOnTheScreen();
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

  describe('free plan', () => {
    const toPro = { pathname: '/pro', params: { reason: 'limit' } };

    it('lets you pick 2, then opens Pro for a third', async () => {
      await render(<AddScreen />);
      expect(screen.getByText(/^Free plan: 2 of 2 spots left\./)).toBeOnTheScreen();

      await fireEvent.press(screen.getByRole('button', { name: /^Add Netflix/ }));
      expect(screen.getByText(/^Free plan: 1 of 2 spot left\./)).toBeOnTheScreen();
      await fireEvent.press(screen.getByRole('button', { name: /^Add Spotify/ }));
      await fireEvent.press(screen.getByRole('button', { name: /^Add Notion/ }));

      expect(router.push).toHaveBeenCalledWith(toPro);
      expect(screen.getByRole('button', { name: 'Add 2 and remind me' })).toBeOnTheScreen();
    });

    it('counts what is already tracked, including for your own', async () => {
      useSubscriptions.getState().add([
        { serviceId: null, name: 'Gym', priceCents: 4000, cycle: 'month', chargeOn: '2026-10-20', trial: false },
        { serviceId: null, name: 'Rent', priceCents: 9000, cycle: 'month', chargeOn: '2026-10-21', trial: false },
      ]);
      await render(<AddScreen />);

      expect(screen.getByText(/^Free plan: no spots left\./)).toBeOnTheScreen();
      await fireEvent.press(screen.getByRole('button', { name: /^Add Netflix/ }));
      await fireEvent.press(screen.getByRole('button', { name: 'Not listed? Add your own' }));

      expect(router.push).toHaveBeenCalledTimes(2);
      expect(router.push).toHaveBeenCalledWith(toPro);
      expect(screen.queryByLabelText('Price')).toBeNull();
    });

    it('has no limit with Pro', async () => {
      usePro.setState({ isPro: true });
      await render(<AddScreen />);

      for (const name of ['Netflix', 'Spotify', 'Notion']) {
        await fireEvent.press(screen.getByRole('button', { name: new RegExp(`^Add ${name}`) }));
      }
      await fireEvent.press(screen.getByRole('button', { name: 'Add 3 and remind me' }));

      expect(router.push).not.toHaveBeenCalled();
      expect(saved()).toHaveLength(3);
      expect(screen.queryByText(/^Free plan/)).toBeNull();
    });
  });
});
