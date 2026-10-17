import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { router } from 'expo-router';

import { requestReminderPermission } from '@/features/reminders/permissions';
import { useSettings } from '@/stores/settings';

import RemindersScreen from '@/app/reminders';
import { LaunchSplash, SPLASH_MS } from '@/components/launch-splash';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('@/features/reminders/permissions', () => ({ requestReminderPermission: jest.fn() }));

const requestPermission = requestReminderPermission as jest.Mock;

/**
 * Taps a pressable synchronously, outside fireEvent's own act(), so a test can
 * land two taps before React re-renders.
 */
function tap(element: ReturnType<typeof screen.getByRole>) {
  element.props.onClick({ nativeEvent: {}, persist: () => {} });
}
const initial = useSettings.getState();

beforeEach(() => {
  jest.clearAllMocks();
  useSettings.setState(initial, true);
});

describe('Launch splash', () => {
  let screenReader: jest.SpyInstance;
  let reduceMotion: jest.SpyInstance;
  beforeEach(() => {
    // setImmediate stays real so act() can flush the accessibility promises.
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
    screenReader = jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(false);
    reduceMotion = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });
  afterEach(() => {
    jest.useRealTimers();
    screenReader.mockRestore();
    reduceMotion.mockRestore();
  });
  // Lets the accessibility checks resolve, then runs timers.
  const advance = (ms: number) =>
    act(async () => {
      await Promise.resolve();
      jest.advanceTimersByTime(ms);
      await Promise.resolve();
    });

  it('shows the tagline and the privacy promise', async () => {
    await render(<LaunchSplash onDone={jest.fn()} />);

    expect(screen.getByText('Catch every charge before it lands.')).toBeOnTheScreen();
    expect(screen.getByText('Your data stays on this phone')).toBeOnTheScreen();
  });

  it('fades out by itself after a moment', async () => {
    const onDone = jest.fn();
    await render(<LaunchSplash onDone={onDone} />);

    await advance(SPLASH_MS - 100);
    expect(onDone).not.toHaveBeenCalled();
    await advance(100);
    await advance(400);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('can be tapped away straight away, and finishes only once', async () => {
    const onDone = jest.fn();
    await render(<LaunchSplash onDone={onDone} />);

    await fireEvent.press(screen.getByRole('button', { name: /Your data stays on this phone\. Continue/ }));
    await advance(400);
    expect(onDone).toHaveBeenCalledTimes(1);
    await advance(SPLASH_MS * 2);
    await advance(400);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('waits for a tap when a screen reader is on', async () => {
    screenReader.mockResolvedValue(true);
    const onDone = jest.fn();
    await render(<LaunchSplash onDone={onDone} />);

    await advance(SPLASH_MS * 3);
    expect(onDone).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: /Continue/ }));
    await advance(400);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('closes without the fade when Reduce Motion is on', async () => {
    reduceMotion.mockResolvedValue(true);
    const onDone = jest.fn();
    await render(<LaunchSplash onDone={onDone} />);

    await fireEvent.press(screen.getByRole('button', { name: /Continue/ }));
    await advance(0);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('Turn on reminders screen', () => {
  it('shows the three timing choices with 1 day before selected', async () => {
    await render(<RemindersScreen />);

    expect(screen.getByRole('radio', { name: '1 day before' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '3 days before' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Morning of' })).not.toBeChecked();
  });

  it('saves the timing the person picks', async () => {
    await render(<RemindersScreen />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Morning of' }));

    expect(useSettings.getState().reminderLead).toBe('morningOf');
    expect(screen.getByRole('radio', { name: 'Morning of' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '1 day before' })).not.toBeChecked();
  });

  it('asks for permission, finishes onboarding with reminders on, and opens Home when allowed', async () => {
    requestPermission.mockResolvedValue(true);
    await render(<RemindersScreen />);

    await fireEvent.press(screen.getByRole('button', { name: /Turn on reminders/ }));

    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(useSettings.getState()).toMatchObject({ hasOnboarded: true, remindersEnabled: true });
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('still finishes onboarding, with reminders off, when the person declines', async () => {
    requestPermission.mockResolvedValue(false);
    await render(<RemindersScreen />);

    await fireEvent.press(screen.getByRole('button', { name: /Turn on reminders/ }));

    expect(useSettings.getState()).toMatchObject({ hasOnboarded: true, remindersEnabled: false });
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('asks only once when the button is tapped twice quickly', async () => {
    let resolve: (granted: boolean) => void = () => {};
    requestPermission.mockReturnValue(new Promise<boolean>((r) => (resolve = r)));
    await render(<RemindersScreen />);
    const button = screen.getByRole('button', { name: /Turn on reminders/ });

    // Two taps in the same frame, before React re-renders the button as disabled.
    await act(async () => {
      tap(button);
      tap(button);
      resolve(true);
    });

    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it('ignores Skip while the permission prompt is open', async () => {
    let resolve: (granted: boolean) => void = () => {};
    requestPermission.mockReturnValue(new Promise<boolean>((r) => (resolve = r)));
    await render(<RemindersScreen />);

    await act(async () => {
      tap(screen.getByRole('button', { name: /Turn on reminders/ }));
      tap(screen.getByRole('button', { name: 'Skip' }));
      resolve(true);
    });

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(useSettings.getState().remindersEnabled).toBe(true);
  });

  it.each(['Skip', 'Not now'])('"%s" finishes onboarding without asking for permission', async (label) => {
    await render(<RemindersScreen />);

    await fireEvent.press(screen.getByRole('button', { name: label }));

    expect(requestPermission).not.toHaveBeenCalled();
    expect(useSettings.getState()).toMatchObject({ hasOnboarded: true, remindersEnabled: false });
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('labels the progress dots for screen readers', async () => {
    await render(<RemindersScreen />);

    expect(screen.getByLabelText('Step 2 of 3')).toBeOnTheScreen();
  });
});
