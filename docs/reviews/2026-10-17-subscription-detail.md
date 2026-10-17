# Review, Subscription detail screen (commit d8ca338), 2026-10-17

**Reviewed by**: Sonnet 5.5 (author model: Opus 5.5)
**Scope**: 17 files, `git show HEAD` (detail screen, cancel guide, catalog `cancel` field, store `update`, `confirm`, row/BigAmount changes, Home/All/Calendar rows opening the screen)
**Verdict**: Changes requested

## Summary
The screen does what the intent describes and the structure is sound: `cancelGuide` is a pure function, `encodeURIComponent` is used correctly for the search URL, `update` merges so `remind` survives an edit (the draft never carries it), `confirm` resolves on every path on iOS, Android and web, the deep link with no history falls back to `replace('/')`, `useToday` keeps the dates fresh, and `Stack.Protected` keeps the route behind onboarding. `tsc`, lint and all 144 tests pass. The real problems are: editing an existing subscription can silently rewrite its renewal date (the editor was built for new ones), the Android "store" steps send Apple-billed services to Google Play, the screen flashes "Not tracked any more" as you leave after cancelling, and `Linking.openURL` is never caught. I read the code and did not run it on a device.

## Critical
None.

## Major
### 🟠 Editing a subscription rewrites its renewal date, `src/components/subscription-editor.tsx:65-66`, `src/app/subscription/[id].tsx:147`
**Problem**: `draftFromSubscription` sets `from: false` and the editor starts with `datePicked = false`. `setCycle` then does `{ cycle, chargeOn: addCycles(today, cycle, 1) }` for any non-trial, so opening Edit on a real subscription (renewing on the 3rd) and tapping Weekly then Monthly again, or just Yearly, replaces the saved anchor with "a cycle from today" without telling the person. Saving keeps it. The same editor also shows `draft.chargeOn` as the selected date, which is the raw stored anchor and can be months in the past (the store rolls it forward in `nextChargeDate`), while the picker's `min` is today. So the "Next charge" the person sees can be a past date they cannot reselect once they move off it, and it disagrees with the pill on the screen ("Renews Nov 3").
**Why it matters**: Editing a price (the most common edit) is safe, but anything that touches the cycle quietly breaks the data the alerts and calendar depend on; the date field misleads on every older subscription.
**Suggested fix**: In `draftFromSubscription` take `nextChargeDate(sub, today)` as `chargeOn` (pass `today`) and have the editor start with `datePicked = true` for saved subscriptions (an `existing` flag on the draft, or `key` check), so cycle changes keep the date. Add tests: edit a subscription with a past anchor, change the cycle, save, and assert `chargeOn` is the next charge date, not today plus a cycle.

### 🟠 Apple-billed services get Google Play steps on Android, `src/features/subscriptions/cancel.ts:35-45`, `src/features/catalog/services.json` (`apple-music`, `apple-tv`, `apple-one`, `apple-arcade`)
**Problem**: `cancel: "store"` picks the store from the device (`platform === 'android'` gives Google Play). Apple Music, TV+, One and Arcade are billed through the Apple ID, never Google Play, so an Android user is told to open Google Play subscriptions and look for "Apple Music", where it does not exist (Apple Music on Android is managed in the Apple Music app or music.apple.com). Duolingo Max is also billed by Duolingo's own site for people who bought on web, yet only store steps are shown (and no "bought it on the web" link). On web, `Platform.OS === 'web'` falls into the iOS branch, so a web user gets App Store steps with an `apps.apple.com` link.
**Why it matters**: Wrong instructions on the one task where a wrong answer costs money.
**Suggested fix**: Make `cancel` carry the store (`"apple"`, `"store"` meaning the device store) or give Apple services a `url`/`steps` object (https://support.apple.com/en-us/118428 covers iOS, Android and web). Handle `web` explicitly (no store link, search or the service's page). For Duolingo use a service page plus the store as the fallback, like the generic path does with `storeUrl`.

### 🟠 The screen flashes "Not tracked any more" when you confirm, `src/app/subscription/[id].tsx:76-85`
**Problem**: `markCancelled` calls `leave()` and then `cancel()`. `router.back()` starts the transition animation, the store update removes the subscription in the next tick, and `SubscriptionScreen` re-renders as `<Missing />` while the detail is still sliding away. On the iOS swipe-back and Android transitions the person sees the hero replaced by the empty state mid-animation. Reversing the order is worse (the replace happens first).
**Why it matters**: It is the screen's main success moment, and it ends with a message that reads as an error.
**Suggested fix**: Keep the last non-missing subscription while leaving: a `useRef` of the last found `sub` in `SubscriptionScreen` (render `<Detail sub={last}>` while `leaving` is true), or run `cancel` from the previous screen after the transition (`InteractionManager.runAfterInteractions` / `setTimeout` of ~350 ms). Keep a test that the record is created exactly once.

### 🟠 `Linking.openURL` is never caught, `src/app/subscription/[id].tsx:119`, `:162`
**Problem**: Both calls ignore the returned promise. It rejects when no app can handle the URL (Android without a browser, locked-down profiles, a malformed catalog URL), which is an unhandled promise rejection (red box in dev, silent nothing in production). The pinned button then looks dead. There is also no feedback in the one case the primary button is a search link and the person is offline.
**Why it matters**: The primary action of the screen.
**Suggested fix**: A small `openLink(url)` helper (in `open.ts`) that awaits `Linking.openURL`, catches, and shows `notify("Couldn't open the page", url)` so they can copy it; use it in both places. Add a test where `openURL` rejects.

## Minor
### 🟡 Pinned buttons float over scrolling content with no backdrop, `src/app/subscription/[id].tsx:159-176`, `:95`
**Problem**: `actions` is absolutely positioned with no background or fade, so "I already cancelled" (muted `inkSoft` text) is drawn on top of whatever card scrolls under it, and on short screens the tiles row sits behind the dark button. The scroll padding is a fixed `insets.bottom + 150`; the buttons' real height is 62 + 6 + 44 + 16 = 128 at default text size, and the secondary link grows with large text while the padding does not.
**Why it matters**: Low contrast and overlap on small phones and larger text.
**Suggested fix**: Put the buttons in a footer `View` below the `ScrollView` (flex column, with a canvas background and a hairline top border) so the scroll area shrinks to fit, or add a canvas gradient behind them. Drop the magic 150.

### 🟡 Name, price and facts do not hold up at large text or long values, `src/app/subscription/[id].tsx:217-232`, `src/components/big-amount.tsx:20-32`
**Problem**: `BigAmount` is a single non-wrapping row (`$` + big dollars + cents + suffix). With the maximum price ($99,999.99, `MAX_PRICE_CENTS`) plus "a month" the row is wider than the 24 px padded hero on a 360 pt screen, and the suffix overflows. The three fact tiles use `numberOfLines={1}` for the value, so "Per year" for a $1,199.88 yearly figure truncates at large text. `Tracked since` shows month and day only ("Oct 17"), which is ambiguous for anything older than a year.
**Why it matters**: Edge cases, but the facts are the point of the hero.
**Suggested fix**: `flexWrap: 'wrap'` on the amount row (or `adjustsFontSizeToFit` on the dollars); let fact values wrap (drop `numberOfLines`) or stack the facts vertically when `fontScale > 1.3`; include the year in "Tracked since" when it is not the current year.

### 🟡 The renewal-alert toggle promises something nothing reads yet, `src/app/subscription/[id].tsx:131-143`
**Problem**: `remind` is stored but no code reads it (the only readers of `remindersEnabled` are the settings/sheet). The tile stays enabled when reminders are off globally (Profile), so the switch shows "on" while nothing will ever fire, and "off" is not honored yet.
**Why it matters**: A control that does nothing, on a safety feature people rely on to not be charged.
**Suggested fix**: Read `remindersEnabled` and show the tile as off with a hint ("Reminders are off in Profile") when it is false; track the scheduler work that reads `remind` as a blocker for shipping, or hide the tile until then.

### 🟡 Accessibility labels differ from the visible text, `src/app/subscription/[id].tsx:113`, `:146`, `:119-125`
**Problem**: The step `aria-label` is `Step 1: ...` on a Text whose number badge is `aria-hidden`, which is fine, but the label overrides the content so the visible and spoken text can drift. The Edit tile says "Edit {name}" while the tile reads "Edit details" (voice control "tap Edit details" fails, WCAG 2.5.3). The "Open App Store subscriptions" link is a nested Text inside a muted label with an 8 pt hit slop, well under 44 pt. The Missing state's title is not `role="heading"` while the Detail's name is.
**Why it matters**: Small, but this is the screen screen-reader users arrive at from a notification link.
**Suggested fix**: Use the visible words in labels (`Edit details for {name}`), make the step badge and text one accessible group instead of overriding the text, give the store link a `minHeight: 44` row, and add `role="heading"` to the Missing title.

### 🟡 "You keep access until {date}" is a promise the app cannot make, `src/features/subscriptions/cancel.ts:36`
**Problem**: The last step is shown for every service, using the next charge date. Some services end access immediately on cancel (many free-trial plans, Apple One bundles shared with others, anything cancelled in the final days of a trial), and for a trial the date is the trial end, not a paid period.
**Why it matters**: Wrong expectation, but low harm.
**Suggested fix**: Say "Most services keep access until {date}" or drop the sentence for trials ("Cancel before {date} to avoid the first charge.").

### 🟡 Alert dialogs sit above the Face ID lock, `src/utils/notify.ts:17-27`
**Problem**: The editor now steps aside while locked (`useLock`), but `confirm`'s native Alert does not, so "Mark cancelled" can be answered over the lock screen. The same applies to `notify`. Also on iOS `cancelable`/`onDismiss` are ignored (Android only), which is fine because the two buttons always resolve, but a double tap on "I already cancelled" queues two alerts and a second `cancel()` is a no-op only because the store guards on a missing id.
**Why it matters**: Consistency with the Profile review finding; low risk here.
**Suggested fix**: Disable the button while a confirm is pending (`useRef`/state) and, if locked, resolve `false` without showing the alert.

### 🟡 Trial flag and past dates after editing, `src/app/subscription/[id].tsx:70-71`
**Problem**: A trial whose end date has passed keeps `trial: true`; `nextChargeDate` rolls the date forward and `trialEnding` is false so the pill says "Renews", but the editor still shows "Free trial" on with a past end date and the Hero facts treat it as a normal subscription. `toCancelled` then treats it as paid (`chargeOn >= today` false), so it counts toward "Cancelled", not "Trial caught", which is consistent, but the editor never offers to clear the stale flag.
**Why it matters**: The person cannot tell why a "trial" now renews; minor, rare.
**Suggested fix**: When opening the editor for a trial with `chargeOn < today`, start with `trial: false` and the next charge date; test it.

## Nits
- `src/app/subscription/[id].tsx:37`: `leave` runs `router.back()` when `canGoBack()` is true even if the previous screen is the Add flow; `router.dismissTo('/')` is safer for a deep link opened over other routes.
- `src/features/subscriptions/cancel.ts:20`: the iOS Subscriptions page opens in Safari with `https://apps.apple.com/account/subscriptions`; `itms-apps://apps.apple.com/account/subscriptions` opens the App Store sheet directly. Confirm on a device in Expo Go.
- `src/features/subscriptions/cancel.ts:17`: `type Platform = 'ios' | 'android' | 'web' | string` collapses to `string`; use `Platform['OS']` from react-native or a `'ios' | 'android' | 'web'` union and map others to ios in one place.
- `src/app/subscription/[id].tsx:108`: the `aria-hidden` on `View` with `accessible` default; fine, but the number badge is the only first-step emphasis (accent) and relies on colour alone.
- YouTube Premium and YouTube Music share the same steps and URL; people who subscribed through the App Store (very common for YouTube Premium) only get a store link on the generic path. Consider a `storeUrl` for catalog services too.

## Resolution

Fixed:
- Major, editing rewrote the date: a saved subscription opens in the editor with its next charge as the date, marked as already chosen, so changing the cycle keeps it. A trial whose end has passed opens as a normal renewal.
- Major, store steps: Apple's own services (`cancel: "apple"`) always get App Store steps. `"store"` (Duolingo Max) follows the phone's store, and web gets the general steps and search.
- Major, flash after confirming: the screen keeps showing the last version of the subscription while it slides away.
- Major, `Linking.openURL`: an `openLink` helper catches failures and says the link couldn't open.
- The bottom padding follows the measured height of the pinned buttons, so it grows with large text.
- "Tracked since" shows the year when it isn't this year.
- The Edit tile's label includes its visible text ("Edit details for Netflix"). The store link has a 44pt target, and the missing-state title is a heading.
- A second tap on "I already cancelled" doesn't queue a second dialog.
- Tests for each fix: 161 passing.

Deferred:
- The renewal-alert toggle is saved per subscription. The reminder scheduler (next) reads it and the global switch together.
- Wording of "You keep access until": general enough for most services. It gets revisited with the Cancel the trial screen, which has trial-specific copy.
- Alerts above the Face ID lock, a backdrop behind the pinned buttons, `BigAmount` at the maximum price with large text, and `dismissTo` for back: in the accessibility and polish pass.
