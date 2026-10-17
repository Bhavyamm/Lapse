import { fireEvent, render, screen } from '@testing-library/react-native';

import { useSettings } from '@/stores/settings';

import ProfileScreen from '@/app/(tabs)/profile';

const initial = useSettings.getState();
const dev = __DEV__;
const setDev = (value: boolean) => ((globalThis as unknown as { __DEV__: boolean }).__DEV__ = value);

afterEach(() => {
  setDev(dev);
  useSettings.setState(initial, true);
});

describe('Profile screen', () => {
  it('in development, "Show onboarding again" clears onboarding so onboarding comes back', async () => {
    setDev(true);
    useSettings.getState().completeOnboarding(true);
    await render(<ProfileScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Show onboarding again' }));

    expect(useSettings.getState()).toMatchObject({ hasOnboarded: false, remindersEnabled: false });
  });

  it('hides "Show onboarding again" in release builds', async () => {
    setDev(false);
    await render(<ProfileScreen />);

    expect(screen.queryByRole('button', { name: 'Show onboarding again' })).not.toBeOnTheScreen();
  });
});
