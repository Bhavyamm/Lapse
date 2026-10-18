import Purchases from 'react-native-purchases';

type Module = typeof import('./purchase');

const info = (pro: boolean) => ({ entitlements: { active: pro ? { pro: {} } : {} } });
const lifetime = { identifier: '$rc_lifetime', product: { priceString: '₹1,299.00' } };

/** A fresh copy of the module, so each test connects anew with its own keys and platform. */
function load(env: Record<string, string | undefined>, where: { os?: string; expoGo?: boolean } = {}): Module {
  process.env = { ...process.env, ...env };
  let mod: Module | undefined;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: where.os ?? 'ios' } }));
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { executionEnvironment: where.expoGo ? 'storeClient' : 'standalone' },
      ExecutionEnvironment: { StoreClient: 'storeClient' },
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- a fresh copy per test
    mod = require('./purchase');
  });
  return mod!;
}

const env = process.env;
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(Purchases.getCustomerInfo).mockResolvedValue(info(false) as never);
  jest.mocked(Purchases.getOfferings).mockResolvedValue({
    current: { lifetime, availablePackages: [lifetime] },
  } as never);
});
afterEach(() => {
  process.env = env;
});

const keys = {
  EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_test',
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: 'goog_test',
  EXPO_PUBLIC_REVENUECAT_TEST_KEY: 'test_key',
};

describe('Pro purchases', () => {
  it('says Pro isn’t on sale without a RevenueCat key, and never touches the SDK', async () => {
    const { purchasePro, restorePro } = load({
      EXPO_PUBLIC_REVENUECAT_IOS_KEY: undefined,
      EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: undefined,
    });

    await expect(purchasePro()).resolves.toBe('unavailable');
    await expect(restorePro()).resolves.toBe('unavailable');
    expect(Purchases.configure).not.toHaveBeenCalled();
  });

  it('connects once and picks up whether Pro is owned and the local price', async () => {
    jest.mocked(Purchases.getCustomerInfo).mockResolvedValue(info(true) as never);
    const { startPro, usePro } = load(keys);

    await startPro();
    await startPro();

    expect(Purchases.configure).toHaveBeenCalledTimes(1);
    expect(Purchases.configure).toHaveBeenCalledWith({ apiKey: 'appl_test' });
    expect(usePro.getState()).toEqual({ isPro: true, price: '₹1,299.00' });
  });

  it('follows Pro changes RevenueCat reports later', async () => {
    const { startPro, usePro } = load(keys);
    await startPro();

    const listener = jest.mocked(Purchases.addCustomerInfoUpdateListener).mock.calls[0][0];
    listener(info(true) as never);

    expect(usePro.getState().isPro).toBe(true);
  });

  it('buys the lifetime package and unlocks Pro', async () => {
    jest.mocked(Purchases.purchasePackage).mockResolvedValue({ customerInfo: info(true) } as never);
    const { purchasePro, usePro } = load(keys);

    await expect(purchasePro()).resolves.toBe('unlocked');
    expect(Purchases.purchasePackage).toHaveBeenCalledWith(lifetime);
    expect(usePro.getState().isPro).toBe(true);
  });

  it('treats backing out of the store sheet as cancelled, and passes on real failures', async () => {
    const { purchasePro } = load(keys);

    jest.mocked(Purchases.purchasePackage).mockRejectedValueOnce({ userCancelled: true });
    await expect(purchasePro()).resolves.toBe('cancelled');

    jest.mocked(Purchases.purchasePackage).mockRejectedValueOnce({ userCancelled: false, message: 'Store down' });
    await expect(purchasePro()).rejects.toMatchObject({ message: 'Store down' });
  });

  it('says Pro isn’t on sale while the store has no lifetime Pro product', async () => {
    const { purchasePro } = load(keys);

    jest.mocked(Purchases.getOfferings).mockResolvedValue({ current: null } as never);
    await expect(purchasePro()).resolves.toBe('unavailable');
    // A monthly package must never be sold under "one-time".
    jest
      .mocked(Purchases.getOfferings)
      .mockResolvedValue({ current: { lifetime: null, availablePackages: [{ identifier: '$rc_monthly' }] } } as never);
    await expect(purchasePro()).resolves.toBe('unavailable');
    expect(Purchases.purchasePackage).not.toHaveBeenCalled();
  });

  it('uses the Android key on Android and the Test Store key in Expo Go', async () => {
    await load(keys, { os: 'android' }).startPro();
    expect(Purchases.configure).toHaveBeenLastCalledWith({ apiKey: 'goog_test' });

    await load(keys, { expoGo: true }).startPro();
    expect(Purchases.configure).toHaveBeenLastCalledWith({ apiKey: 'test_key' });
  });

  it('says Pro isn’t on sale when RevenueCat turns the key down, and tries again later', async () => {
    jest.mocked(Purchases.configure).mockImplementationOnce(() => {
      throw new Error('Invalid API key');
    });
    const { purchasePro, startPro } = load(keys);

    await expect(purchasePro()).resolves.toBe('unavailable');
    await expect(startPro()).resolves.toBe(true);
    expect(Purchases.configure).toHaveBeenCalledTimes(2);
  });

  it('says a paid purchase is pending until Pro is granted, rather than cancelled', async () => {
    jest.mocked(Purchases.purchasePackage).mockResolvedValue({ customerInfo: info(false) } as never);
    const { purchasePro } = load(keys);

    await expect(purchasePro()).resolves.toBe('pending');

    jest.mocked(Purchases.getCustomerInfo).mockResolvedValue(info(true) as never);
    await expect(purchasePro()).resolves.toBe('unlocked');
  });

  it('handles Ask to Buy, and Pro already owned by this store account', async () => {
    const { purchasePro } = load(keys);

    jest.mocked(Purchases.purchasePackage).mockRejectedValueOnce({ code: '20' });
    await expect(purchasePro()).resolves.toBe('pending');

    jest.mocked(Purchases.purchasePackage).mockRejectedValueOnce({ code: '6' });
    jest.mocked(Purchases.restorePurchases).mockResolvedValueOnce(info(true) as never);
    await expect(purchasePro()).resolves.toBe('unlocked');
  });

  it('restores Pro, or says no purchase was found', async () => {
    const { restorePro } = load(keys);

    jest.mocked(Purchases.restorePurchases).mockResolvedValueOnce(info(false) as never);
    await expect(restorePro()).resolves.toBe('nothing');

    jest.mocked(Purchases.restorePurchases).mockResolvedValueOnce(info(true) as never);
    await expect(restorePro()).resolves.toBe('unlocked');
  });

  it('keeps the app working when RevenueCat can’t be reached at launch, and catches up later', async () => {
    jest.mocked(Purchases.getCustomerInfo).mockRejectedValueOnce(new Error('offline'));
    const { refreshPro, startPro, usePro } = load(keys);

    await expect(startPro()).resolves.toBe(true);
    expect(usePro.getState()).toEqual({ isPro: false, price: null });

    jest.mocked(Purchases.getCustomerInfo).mockResolvedValue(info(true) as never);
    await refreshPro();
    expect(usePro.getState()).toEqual({ isPro: true, price: '₹1,299.00' });
  });
});
