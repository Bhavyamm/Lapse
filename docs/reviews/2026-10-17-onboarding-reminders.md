# Review, claude/expo-scaffold-4fl2hv, 2026-10-17

**Reviewed by**: Sonnet 5.5 (author model not stated)
**Scope**: 16 files, uncommitted
**Verdict**: Changes requested

## Summary
Onboarding step 1: a welcome screen, a reminders screen with timing chips and an expo-notifications permission request, and a persisted zustand store gating the tabs through `Stack.Protected`. The structure is clean and `tsc --noEmit` passes. The headline issues are a non-scrolling reminders layout that very likely pushes the CTA off-screen on common phone sizes, and a permission flow that probably never shows the prompt on Android 13+. Hydration failure handling and hard-coded colors also need attention.

## Major
### 🟠 Reminders screen is fixed-height and not scrollable, `src/app/reminders.tsx:43`
**Problem**: The screen is a plain `ScreenBackground` column. Nothing scrolls, and fixed offsets are stacked on top of each other (marginTop 100, mascot top -88, 52px card padding, two notifications, 36px hero, a 3 to 4 line lede, wrapping chips, then a pinned actions block). A rough tally is 850 to 900pt of content plus safe-area insets. `welcome.tsx` has the same fixed layout (300px mascot area and 170px bottom padding).
**Why it matters**: On an iPhone SE, a small Android phone, or with larger system text, the "Turn on reminders" CTA and "Not now" fall below the fold. The only way forward is the small "Skip", which defeats the screen's purpose and silently loses the permission ask.
**Suggested fix**: Wrap the middle content in a ScrollView, or make it adapt to height. Keep the actions block pinned. Check on a 667pt-tall device and at the largest font scale. Do the same sanity check for the welcome screen mascot and bubble.

### 🟠 Android 13+ permission prompt likely never appears, `src/features/reminders/permissions.ts:12`
**Problem**: There is no Android notification channel created before `requestPermissionsAsync()`. As I recall, expo-notifications on Android 13+ only shows the system prompt once a channel exists. I could not verify this against the SDK 58 docs here, so please check them.
**Why it matters**: If I am right, the call resolves not-granted without showing a dialog. The user is told nothing, `remindersEnabled` is stored as false, and the core feature of the app is dead on most current Android devices.
**Suggested fix**: On Android, call `setNotificationChannelAsync` with a default channel before requesting. Confirm in the SDK 58 `expo-notifications` docs. Also test in Expo Go on Android, since AGENTS.md requires Expo Go to keep working.

## Minor
### 🟡 App can hang on a blank screen if storage hydration fails, `src/stores/settings.ts:40` / `src/app/_layout.tsx:28`
**Problem**: `ready` requires `hydrated`. As I recall, zustand's persist sets `hasHydrated` only on the success path. If `AsyncStorage.getItem` rejects (or the migration throws), `onFinishHydration` never fires. The layout then returns `null` and the splash screen is held forever. The font `error` case is handled but the storage error case is not.
**Why it matters**: A storage failure turns into an app that never opens, with no recovery.
**Suggested fix**: Handle `onRehydrateStorage` errors (or a timeout) and treat them as hydrated with defaults. Verify the zustand v5 behavior.

### 🟡 Hard-coded colors in new components, `src/components/app-logo.tsx:10`, `src/components/notification-preview.tsx:19`
**Problem**: AGENTS.md says not to hard-code new colors. The logo has about ten hex values and the notification preview has `#FFB07A`, `#C9541F`, `#FFD2B0` and `rgba(255,255,255,0.94)`. `#EE7A3A` and `#FFB07A` duplicate `colors.accent` and `colors.accentLight` (which is `#FFAA6E`, near but different). The `boxShadow` values in welcome.tsx and the preview are also inline.
**Why it matters**: Drift from the token system, and the brand orange now lives in several places.
**Suggested fix**: Move the logo and gradient stops and the card tint into tokens (for example a `brand` group), and reference them. The logo is arguably a brand asset, so a one-line comment justifying literals there would be acceptable.

### 🟡 Double-tap can fire two permission requests, `src/app/reminders.tsx:34`
**Problem**: The `asking` guard reads React state. Two presses before the re-render both see `false`, so both call `requestReminderPermission()` and then `finish` twice (two `router.replace`).
**Why it matters**: A duplicated navigation or request on a fast double tap.
**Suggested fix**: Guard with a ref (or set the flag synchronously).

### 🟡 Welcome screen hides its content from screen readers, `src/app/welcome.tsx:17`
**Problem**: The whole screen is one `Pressable` with `accessibilityLabel="Continue"`. That makes it a single accessible element, so the tagline, privacy line and bubble text are never read.
**Why it matters**: A VoiceOver or TalkBack user hears only "Continue" and misses the privacy message.
**Suggested fix**: Keep the content readable and give a separate, explicit Continue control, or fold the text into the label or hint.

### 🟡 Page dots fail non-text contrast on the light canvas, `src/components/page-dots.tsx:28`
**Problem**: Idle dots use `textOnDarkSecondary` (#B5B5B5) on `canvas` (#E6E5E7), roughly 1.6:1.
**Why it matters**: The progress indicator is nearly invisible for low-vision users (WCAG 1.4.11 asks for 3:1).
**Suggested fix**: Use a darker token for idle dots on light surfaces.

### 🟡 Permission result is a one-time snapshot, `src/stores/settings.ts:11`
**Problem**: `remindersEnabled` is written once at onboarding and never reconciled with the OS. Revoking in Settings later leaves it true. Choosing "Turn on" for a denied-forever user also shows no explanation or settings link, since `canAskAgain` false returns false.
**Why it matters**: Later scheduling code could trust a stale flag.
**Suggested fix**: Treat the store value as a preference and re-check `getPermissionsAsync()` before scheduling. Consider a "Open Settings" path for the denied case. Not blocking for step 1.

### 🟡 Navigation after the guard flips is unverified, `src/app/reminders.tsx:29`
**Problem**: `completeOnboarding` flips the guard synchronously, which removes `welcome` and `reminders` from the stack, and `router.replace('/')` then runs immediately. Whether this lands cleanly on the tabs (rather than a double transition or a flash) depends on Expo Router's redirect behavior. Also the initial route when `/` is protected relies on the first accessible screen being `welcome`.
**Why it matters**: Possible flicker or a wrong landing route on web deep links.
**Suggested fix**: Try cold start, hard reload on `/reminders`, finish via Skip, and finish via grant, on iOS, Android and web. If `Stack.Protected` already redirects, the explicit replace may be unnecessary.

## Nits
- ⚪ `src/app/reminders.tsx:48`, `src/app/reminders.tsx:95`, `src/app/welcome.tsx:18`, `src/components/page-dots.tsx:11`: still use `accessibilityRole`/`accessibilityLabel` while the rest of the change moved to `role`/`aria-*`. Pick one.
- ⚪ `src/components/pill-button.tsx:28`: disabled and pressed both use opacity 0.85, so the disabled state looks no different. The `asking` state is only visible through the label text.
- ⚪ `src/components/notification-preview.tsx` / `src/app/reminders.tsx:61`: sample copy names real brands (Duolingo, Netflix) and is not driven by the selected lead time.
- ⚪ `package.json`: `expo-notifications` is `~58.1.5` while sibling packages are `~58.0.x`, and `async-storage`/`zustand` use carets. Run `npx expo install --check` to confirm SDK compatibility. Jest dev dependencies are included here although the test setup is a separate step.
- ⚪ `src/features/reminders/lead-time.ts:12`: `reminderLeadLabel` has no caller yet.
- ⚪ `src/app/welcome.tsx:96`, `src/app/reminders.tsx:117`: several magic layout numbers (170, 196, -64, -150, 100, -88) are tied to the current mascot size.

## Strengths
- `requestReminderPermission` never throws, handles web and the can't-ask-again case, and lets onboarding always continue.
- Hydration gating avoids a flash of the wrong stack, and `partialize` keeps actions out of storage.
- Welcome sets its own night `contentStyle`, which avoids a white flash during transitions.
- `useId`-prefixed SVG gradient ids prevent collisions when the logo renders more than once.
- Types are tight (`ReminderLead` union) and `tsc --noEmit` is clean.

## Test coverage
Test signal is none-yet: there is no runner in place at review time (Jest via jest-expo is being added next). Note the gap once. The branching logic most worth covering first is `requestReminderPermission` (granted, denied, `canAskAgain` false, throw, web), the settings store (`completeOnboarding`, persistence and version), and the Chip radio semantics. Typecheck passes, but it will not catch the runtime layout and Android prompt issues above, so a manual run on a small iPhone and an Android 13+ device should be part of verification.

## Resolution (author, same day)

- Fixed: reminders screen now scrolls between a pinned top bar and pinned actions; checked at 375x667, CTA and "Not now" on screen.
- Fixed: Android creates a `reminders` channel (high importance) before asking, so the Android 13+ prompt can show.
- Fixed: hydration uses an own `hydrated` flag set from `onRehydrateStorage`, which runs on success and on error, so a storage failure no longer holds the splash screen (zustand's `hasHydrated()` stays false on error, confirmed in its source).
- Fixed: double tap guarded with a ref; Skip and Not now are ignored while the request is open.
- Fixed: welcome screen's accessible label now carries its text and privacy line.
- Fixed: brand gradient colors moved to `brand` tokens; remaining `accessibilityRole` uses switched to `role`/`aria-*`; disabled pill uses opacity 0.6; unused `reminderLeadLabel` removed.
- Kept: idle page dots stay #B5B5B5 to match the design; the group exposes "Step 2 of 3" to screen readers and the current step is also shown by width.
- Deferred to the reminder scheduler step: re-check OS permission before scheduling, and an "Open Settings" path when permission is denied for good.
- Verified on web: finishing via grant and via Skip lands on Home with no flash; deep links before onboarding land on welcome.
