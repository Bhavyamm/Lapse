import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { AppLock } from '@/components/app-lock';
import { getBiometrics, unlock } from '@/features/lock/biometrics';
import { useLock } from '@/stores/lock';
import { useSettings } from '@/stores/settings';

jest.mock('@/features/lock/biometrics', () => ({ getBiometrics: jest.fn(), unlock: jest.fn() }));

const initial = useSettings.getState();
let emit: (state: AppStateStatus) => void = () => {};

beforeEach(() => {
  jest.mocked(getBiometrics).mockResolvedValue({ ready: true, name: 'Face ID' });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    emit = listener as (state: AppStateStatus) => void;
    return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.mocked(unlock).mockReset();
  useSettings.setState(initial, true);
});

describe('AppLock', () => {
  it('shows nothing when the lock is off', async () => {
    await render(<AppLock canPrompt />);
    expect(screen.queryByText('lapse. is locked')).not.toBeOnTheScreen();
    expect(unlock).not.toHaveBeenCalled();
  });

  it('waits for the splash, then asks for Face ID and opens', async () => {
    useSettings.setState({ appLock: true });
    jest.mocked(unlock).mockResolvedValue('unlocked');
    const view = await render(<AppLock canPrompt={false} />);

    expect(screen.getByText('lapse. is locked')).toBeOnTheScreen();
    expect(unlock).not.toHaveBeenCalled();

    await view.rerender(<AppLock canPrompt />);
    await act(async () => {});

    expect(unlock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('lapse. is locked')).not.toBeOnTheScreen();
    expect(useLock.getState().locked).toBe(false);
  });

  it('stays locked after a cancel until the button works', async () => {
    useSettings.setState({ appLock: true });
    jest.mocked(unlock).mockResolvedValueOnce('failed').mockResolvedValueOnce('unlocked');
    await render(<AppLock canPrompt />);
    await act(async () => {});
    expect(screen.getByText('lapse. is locked')).toBeOnTheScreen();

    // The prompt itself makes iOS go inactive and back; that must not ask again.
    await act(async () => emit('inactive'));
    await act(async () => emit('active'));
    expect(unlock).toHaveBeenCalledTimes(1);

    await fireEvent.press(await screen.findByRole('button', { name: 'Unlock with Face ID' }));
    expect(screen.queryByText('lapse. is locked')).not.toBeOnTheScreen();
  });

  it('locks again when the app comes back from the background', async () => {
    useSettings.setState({ appLock: true });
    jest.mocked(unlock).mockResolvedValue('unlocked');
    await render(<AppLock canPrompt />);
    await act(async () => {});
    expect(screen.queryByText('lapse. is locked')).not.toBeOnTheScreen();

    jest.mocked(unlock).mockResolvedValueOnce('failed');
    await act(async () => emit('background'));
    expect(screen.getByText('lapse. is locked')).toBeOnTheScreen();
    await act(async () => emit('active'));
    expect(unlock).toHaveBeenCalledTimes(2);
  });

  it('turns the lock off when the phone can no longer check Face ID or a passcode', async () => {
    useSettings.setState({ appLock: true });
    jest.mocked(unlock).mockResolvedValue('unavailable');
    await render(<AppLock canPrompt />);
    await act(async () => {});

    expect(screen.queryByText('lapse. is locked')).not.toBeOnTheScreen();
    expect(useSettings.getState().appLock).toBe(false);
  });

  it('tells the rest of the app while it is locked', async () => {
    useSettings.setState({ appLock: true });
    jest.mocked(unlock).mockResolvedValue('failed');
    await render(<AppLock canPrompt />);
    await act(async () => {});

    expect(useLock.getState().locked).toBe(true);
  });

  it('covers the app as it leaves the screen, for the app switcher', async () => {
    useSettings.setState({ appLock: true });
    jest.mocked(unlock).mockResolvedValue('unlocked');
    const view = await render(<AppLock canPrompt />);
    await act(async () => {});
    expect(view.toJSON()).toBeNull();

    await act(async () => emit('inactive'));
    expect(view.toJSON()).not.toBeNull();
    expect(screen.queryByText('lapse. is locked')).not.toBeOnTheScreen();

    await act(async () => emit('active'));
    expect(view.toJSON()).toBeNull();
    expect(unlock).toHaveBeenCalledTimes(1);
  });
});
