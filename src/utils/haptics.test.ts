import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { error, selection, success, tap } from './haptics';

describe('haptics', () => {
  beforeEach(() => jest.clearAllMocks());

  it('plays the system pattern that matches each moment', () => {
    selection();
    tap();
    success();
    error();

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
  });

  it('shrugs off a phone that cannot play them', async () => {
    jest.mocked(Haptics.selectionAsync).mockRejectedValueOnce(new Error('unavailable'));
    expect(() => selection()).not.toThrow();
    await Promise.resolve();
  });

  it('does nothing on the web', () => {
    const os = Platform.OS;
    Platform.OS = 'web';
    selection();
    Platform.OS = os;

    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});
