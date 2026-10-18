# Review, RevenueCat Pro purchases, 2026-10-18

**Reviewed by**: Sonnet
**Verdict**: Changes needed. The SDK calls themselves are used correctly (configure, listener, getOfferings, purchasePackage, restorePurchases, `offering.lifetime`, `priceString`), and no-key / Expo Go / web boot paths do not crash. Two real problems: a charged purchase can be reported as "cancelled", and a failed `configure` is treated as success forever.

## Major

### 1. A completed purchase without the `pro` entitlement is reported as cancelled
`src/features/pro/purchase.ts:78-79`
`purchasePackage` resolving means the store took the money. If `ownsPro(customerInfo)` is false (entitlement id in the dashboard is not exactly `pro`, product not attached to the entitlement, or a delayed grant), the code returns `'cancelled'`, and `explain` shows nothing.
Scenario: dashboard entitlement is named `Pro` or the lifetime product is not attached. The user pays, the sheet closes, nothing happens, no error, no unlock. They will pay again or request a refund.
Fix: only return `'cancelled'` from the `userCancelled` catch. On resolve with no entitlement, call `Purchases.getCustomerInfo()` (or `restorePurchases`) once; if still not Pro, throw or return a new result (e.g. `'pending'`) that tells the user "Purchase completed but Pro isn't active yet. Tap Restore."

### 2. A thrown `configure` is swallowed and cached as "started OK"
`src/features/pro/purchase.ts:46-58`
`configure`, `getCustomerInfo` and `getOfferings` share one try/catch that returns `true`, and the promise is cached in `started`. In browser mode the SDK's `setupPurchases` throws when the key is not `test_`/`rcb_` (environment check in `browser/nativeModule.js:54-58`). It also throws on other bad keys. The doc comment says "Never throws" and "Resolves false when there is no key", but this path resolves `true`.
Scenario: an `appl_...` key is pasted into `EXPO_PUBLIC_REVENUECAT_TEST_KEY`, or any key is rejected. `startPro()` resolves `true`, so `purchasePro()` skips the "not on sale" branch, then `Purchases.getOfferings()` throws "not configured". The user sees "Something went wrong / The store didn't answer", and every later tap does the same until the app restarts. In a dev or store build, any configure failure is cached for the whole session.
Fix: wrap `configure` on its own and return `false` (and clear `started`) on failure. Keep the try/catch for the two fetches separate and return `true` there.

## Minor

### 3. Pending and already-owned purchases get the generic error
`src/features/pro/purchase.ts:80-82`, `src/app/pro.tsx:72`
Everything except `userCancelled` is rethrown and shown as "The store didn't answer."
- `PAYMENT_PENDING_ERROR` (Ask to Buy, Android pending payment) is not a failure. The user is told to retry and may be charged later.
- `PRODUCT_ALREADY_PURCHASED_ERROR` is shown as a store outage.
Scenario: the user already owns Pro on this store account (see #4), taps Unlock, and gets "store didn't answer" when it should unlock.
Fix: in the catch, map `error.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR` to a `'pending'` result ("Waiting for approval, Pro unlocks when it clears"). Map `PRODUCT_ALREADY_PURCHASED_ERROR` to `return restorePro()`. Prefer `code === PURCHASE_CANCELLED_ERROR` over the deprecated `userCancelled`.

### 4. `isPro`/price are not retried, and are unknown for the first moments of every launch
`src/features/pro/purchase.ts:46-58`, `src/app/pro.tsx:61-62, 125`
`isPro` starts `false` in memory and is never persisted. If `getCustomerInfo` or `getOfferings` fails at launch (offline), `started` is cached, so `price` stays null and `isPro` stays false until the SDK happens to call the listener. Even online, there is a window before the first response where an owner sees "Unlock Pro" and "Restore purchase".
Scenario: an existing Pro owner opens Profile in airplane mode and gets the upsell, or taps buy during the window and hits #3.
Fix: re-run the fetch (not `configure`) on app foreground and at the start of `purchasePro`/`restorePro`. Optionally keep a `loading` flag in the store and disable the buy button until it clears, and cache `isPro` in the existing settings storage as a hint.

### 5. Fallback to `availablePackages[0]` can sell the wrong product as "once"
`src/features/pro/purchase.ts:67`
If the current offering has no `$rc_lifetime` package, the first package is bought and priced. The UI says "One-time. No renewal, ever."
Scenario: the offering contains only a custom-id or monthly package. The user is shown and charged a recurring subscription under the "one-time" copy.
Fix: use `offering.lifetime` only (or match `packageType === PACKAGE_TYPE.LIFETIME`), otherwise return `'unavailable'`.

### 6. Price shown in the UI is not refreshed from the package that is bought
`src/features/pro/purchase.ts:52-53, 71-77`
`price` is set only once in `startPro`. `purchasePro` refetches the package but does not update `price`.
Scenario: the launch fetch failed, so the button shows the hard-coded `$14.99` while the store sheet shows `₹1,299`. This is also the fallback state in #4.
Fix: `usePro.setState({ price: pkg.product.priceString })` inside `purchasePro` after `proPackage()`.

## Nits

- `src/features/pro/purchase.ts:30` sandbox detection uses `ExecutionEnvironment.StoreClient`, but the SDK decides browser mode itself (`NativeModules.RNPurchases` absent and `globalThis.expo.modules.ExpoGo`, or web). These agree today. A dev build without the native module linked would get a store key and throw, which is #2's path. Consider `Purchases.isConfigured()` or a warning, not a change in logic.
- `src/features/pro/purchase.ts:50` `addCustomerInfoUpdateListener` has no removal; fine as a singleton, but Fast Refresh re-evaluating the module re-runs `configure` and stacks listeners in dev.
- `src/features/pro/purchase.test.ts` only covers the iOS key branch. The Android key, web and `StoreClient` (Test Store key) branches, and the `configure`-throws case from #2, are untested.
- `src/app/pro.tsx:72` the catch discards the error, so a real RevenueCat message ("Store down", offline) is never logged.

## Resolution
All checks pass (typecheck, lint, format, 279 tests). The web build still opens Pro and says it isn't on sale without a key, with no errors.

1. **Charged but reported cancelled**: fixed. Only a cancel from the store sheet returns `cancelled`. A purchase that resolves without the `pro` entitlement re-reads customer info once, then returns `pending` ("Almost there … tap Restore purchase").
2. **Failed configure cached**: fixed. `configure` runs outside the cached promise; a throw resolves false and isn't remembered, so the next try configures again. Test added.
3. **Pending and already owned**: `PAYMENT_PENDING_ERROR` returns `pending`; `PRODUCT_ALREADY_PURCHASED_ERROR` restores; cancel is matched by `PURCHASE_CANCELLED_ERROR` as well as `userCancelled`. Tests added.
4. **No retry after an offline launch**: `refreshPro()` re-reads Pro and the price, run when the app returns to the foreground and before each purchase. `isPro` is not cached locally: RevenueCat's SDK already caches customer info on device, so the launch window is short.
5. **Fallback package**: removed. Only the offering's lifetime package is sold; anything else is `unavailable`. Test added.
6. **Price refresh**: `proPackage()` updates the price every time it reads the package.

Nits: the Android and Expo Go key branches are tested, and the Pro screen logs the store error with `console.warn`. Sandbox detection and the Fast Refresh listener are left as they are (development only; they agree with the SDK today).
