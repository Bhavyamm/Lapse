/** The one-time Pro unlock. Shown before the store has a price to give us. */
export const PRO_PRICE = '$14.99';

export type PurchaseResult = 'unlocked' | 'cancelled' | 'unavailable';

/**
 * Buys Pro through the App Store or Google Play. Store purchases need RevenueCat, which needs a
 * development build and store products, so until those exist this answers 'unavailable'.
 */
export async function purchasePro(): Promise<PurchaseResult> {
  return 'unavailable';
}

/** Brings back a Pro unlock bought on another phone or before a reinstall. */
export async function restorePro(): Promise<PurchaseResult> {
  return 'unavailable';
}
