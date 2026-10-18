import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, { PURCHASES_ERROR_CODE, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { create } from 'zustand';

/** The one-time Pro unlock's price, shown until the store gives the local one. */
export const PRO_PRICE = '$14.99';

/** The RevenueCat entitlement that Pro unlocks. Its id in the RevenueCat dashboard. */
export const PRO_ENTITLEMENT = 'pro';

/**
 * `pending`: paid or waiting for approval (Ask to Buy), but Pro isn't active yet.
 * `nothing`: a restore that found no Pro purchase on this store account.
 */
export type PurchaseResult = 'unlocked' | 'cancelled' | 'pending' | 'unavailable' | 'nothing';

type ProState = {
  /** True when this store account owns Pro. */
  isPro: boolean;
  /** The store's price in the phone's currency, such as "$14.99" or "₹1,299", once known. */
  price: string | null;
};

/** Whether this phone has Pro, kept current from RevenueCat. */
export const usePro = create<ProState>()(() => ({ isPro: false, price: null }));

/**
 * The RevenueCat public API key for where the app runs. Expo Go and the web can't reach the App
 * Store or Google Play (the SDK runs in browser mode there), so they use the Test Store key.
 */
function apiKey(): string | undefined {
  const sandbox = Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (sandbox) return process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY;
  return Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
}

const ownsPro = (info: CustomerInfo) => PRO_ENTITLEMENT in info.entitlements.active;
const showOwned = (info: CustomerInfo) => {
  const isPro = ownsPro(info);
  usePro.setState({ isPro });
  return isPro;
};

/** The one-time Pro package: the current offering's lifetime one. Anything else isn't "once". */
async function proPackage(): Promise<PurchasesPackage | null> {
  const pkg = (await Purchases.getOfferings()).current?.lifetime ?? null;
  if (pkg) usePro.setState({ price: pkg.product.priceString });
  return pkg;
}

let started: Promise<boolean> | null = null;

/**
 * Connects to RevenueCat once per launch and keeps `usePro` current. Resolves false when this
 * build has no key or RevenueCat turned it down, so the app runs without purchases. Never throws.
 */
export function startPro(): Promise<boolean> {
  if (started) return started;
  const key = apiKey();
  if (!key) return (started = Promise.resolve(false));
  try {
    Purchases.configure({ apiKey: key });
    Purchases.addCustomerInfoUpdateListener(showOwned);
  } catch {
    // A rejected key: not remembered, so the next try asks again instead of failing all session.
    return Promise.resolve(false);
  }
  started = refreshPro().then(() => true);
  return started;
}

/**
 * Asks RevenueCat again whether Pro is owned and what it costs, such as when the app comes back
 * after starting offline. Never throws.
 */
export async function refreshPro(): Promise<void> {
  try {
    showOwned(await Purchases.getCustomerInfo());
    await proPackage();
  } catch {
    // Offline: the last answer stands, and the next refresh or purchase asks again.
  }
}

const errorCode = (error: unknown) => (error as { code?: string } | null)?.code;

/** Buys Pro through the App Store or Google Play. Throws when the store fails for another reason. */
export async function purchasePro(): Promise<PurchaseResult> {
  if (!(await startPro())) return 'unavailable';
  const pkg = await proPackage();
  if (!pkg) return 'unavailable';
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    if (showOwned(customerInfo)) return 'unlocked';
    // The store took the payment; RevenueCat can take a moment to grant Pro.
    return showOwned(await Purchases.getCustomerInfo()) ? 'unlocked' : 'pending';
  } catch (error) {
    const code = errorCode(error);
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || (error as { userCancelled?: boolean }).userCancelled)
      return 'cancelled';
    if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending';
    if (code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) return restorePro();
    throw error;
  }
}

/** Brings back a Pro unlock bought on another phone or before a reinstall. */
export async function restorePro(): Promise<PurchaseResult> {
  if (!(await startPro())) return 'unavailable';
  return showOwned(await Purchases.restorePurchases()) ? 'unlocked' : 'nothing';
}
