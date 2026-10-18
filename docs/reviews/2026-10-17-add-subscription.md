# Review, claude/expo-scaffold-4fl2hv, 2026-10-17

**Reviewed by**: Sonnet 5.5 (author model not stated)
**Scope**: 22 files, uncommitted (generated `logos.generated.json` and `package-lock.json` skipped)
**Verdict**: Changes requested

## Summary
The Add screen, catalog search, editor sheet, date picker, subscriptions store and Home "Coming up" list. The pure logic is in good shape: I ran `addMonths`, `nextChargeDate`, `parsePrice`, `searchCatalog` and the date helpers under `TZ=America/Sao_Paulo` and `Pacific/Auckland`, and month-end clamping, leap-year anchors, DST and rolling forward from the original anchor all behave. `typecheck`, `lint`, `format:check` and `jest` pass. Catalog data is clean (no duplicate ids, all icons resolve, all colors valid). The real risks are on the device: keyboard handling on Android (the editor sheet in a `Modal` and the pinned CTA), and a few screens that go stale or crowd out content on small phones. I could not run the app on a device, so the Android item is a risk to check rather than a confirmed failure.

## Major
### 🟠 Keyboard likely covers the editor's Price field and Save on Android, `src/components/subscription-editor.tsx:396`, `src/app/add.tsx:67`
**Problem**: Both `KeyboardAvoidingView`s use `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`. SDK 57 apps are edge-to-edge on Android, and, as I recall, `adjustResize` no longer resizes the window in that mode. A React Native `Modal` is a separate window that also does not inherit the resize behaviour reliably. I could not verify this on a device or against the SDK 57 docs here, so please check.
**Why it matters**: If I am right, tapping Price in the sheet opens the keyboard over the field and the Save button, and the sheet cannot be scrolled clear (the `ScrollView` is not resized). On `add.tsx` the absolutely positioned CTA could sit under the keyboard, which is acceptable there, but the editor is the main way to enter data.
**Suggested fix**: Check the SDK 57 keyboard docs. Use `behavior="padding"` on Android as well (or `react-native-keyboard-controller` if a dev build is allowed, but not in Expo Go). Test on an Android device in Expo Go: tap Price, the custom Name, then Save. Also set `statusBarTranslucent` and `navigationBarTranslucent` on the `Modal` and confirm `insets.bottom` is not double counted (see the Minor on the Modal below).

## Minor
### 🟡 Home "Coming up" never recomputes after midnight or a long background, `src/app/(tabs)/index.tsx:50`
**Problem**: `ComingUp` calls `getToday()` during render. Nothing re-renders it when the date changes while the app stays mounted (tabs are kept alive; resuming from background does not render).
**Why it matters**: The morning after a charge, the row still shows yesterday's date as "next" and the order is wrong until some state changes. This is the screen whose job is "what charges soon".
**Suggested fix**: Keep `today` in state and refresh it on `AppState` `change` to `active` (and on tab focus). Do the same for the `today` captured once in `add.tsx:31`, which only matters if the screen sits open overnight.

### 🟡 Default charge date drifts off the 29th to 31st for monthly services, `src/features/subscriptions/draft.ts:31`, `src/features/subscriptions/billing.ts:21`
**Problem**: The default `chargeOn` is `addCycles(today, cycle, 1)`, which clamps (Jan 31 gives Feb 28). That clamped value is then stored as the anchor, and `nextChargeDate` always counts from the stored anchor, so every later month lands on the 28th (Mar 28, Apr 28).
**Why it matters**: Someone who subscribes on the 31st and accepts the default gets reminders three days early every month. The stored date has lost the original day-of-month.
**Suggested fix**: Store a `dayOfMonth` anchor (or the original start date) next to `chargeOn`, and compute from that. If the date is purely user-entered, state in the UI that it is the next charge date and tell the user to pick the real one.

### 🟡 Defaults do not follow cycle or trial edits, `src/components/subscription-editor.tsx:455`, `:464`
**Problem**: Switching Monthly to Weekly or Yearly, or toggling Free trial, only changes the flag. `chargeOn` stays at today plus one month, and the label flips between "Next charge" and "Trial ends" over the same date.
**Why it matters**: A weekly service saved with a date a month away, or a "trial ends" date that is just the next-month default, produces a wrong first reminder unless the user notices.
**Suggested fix**: When the user has not touched the date yet, recompute it on cycle change (and to `today + trialDays` or a sensible default on trial toggle). Track a `dateTouched` flag in the draft.

### 🟡 Sheet dismisses without animation and the dim backdrop pops, `src/components/subscription-editor.tsx:372`
**Problem**: `<Modal visible={!!draft} animationType="slide">` renders its content only while `draft` is set. When `draft` becomes null, the sheet and backdrop unmount at once, so the slide-out has nothing to animate.
**Why it matters**: The sheet blinks away. Cosmetic, but it is the main interaction of the screen.
**Suggested fix**: Keep the last draft in a ref/state while the modal animates out, or drive `visible` separately and clear the draft in `onDismiss`.

### 🟡 Android Modal is not edge-to-edge, so bottom padding may be doubled, `src/components/subscription-editor.tsx:398`
**Problem**: The sheet adds `insets.bottom` from the root provider. On Android the `Modal` window is not translucent by default, so it already sits above the navigation bar.
**Why it matters**: A gap of one nav bar height under Save on gesture-nav phones, or the sheet drawn under the bar if the window is translucent.
**Suggested fix**: Decide with `navigationBarTranslucent` (see the Major above) and verify on a three-button and a gesture-nav device.

### 🟡 Small phones: selected cards plus the keyboard leave almost no room for results, `src/app/add.tsx:97`
**Problem**: Selected cards render at the top of the same scroll view as the results (about 120pt each), above the section title. The header, title and search take about 190pt, the keyboard on an iPhone SE about 260pt, and the pinned CTA covers the bottom 60pt+. On iOS the CTA also sits `insets.bottom` above the keyboard (the `padding` behavior already clears the safe area), a wasted gap.
**Why it matters**: After picking two or three services, a typed search shows its first result only after scrolling past the selected cards, on a screen with roughly 150pt of list.
**Suggested fix**: Collapse selected items to a compact chip row or a "2 selected" summary while the search field is focused, or put results first. Drop `insets.bottom` from the CTA offset while the keyboard is visible (`Keyboard` events or `useKeyboardAnimation`).

### 🟡 Search edge cases: symbol-only and non-Latin queries, and cross-word matches, `src/features/catalog/catalog.ts:44`, `src/app/add.tsx:41`, `:113`
**Problem**: `normalize` strips everything outside `a-z0-9`, so "&", "日本" or "Дом" normalize to `''` and `searchCatalog` returns the Popular list. `typed` is non-empty, so the heading says "Results" over unrelated popular items and "No match" never shows. Separately, the "contains" rank (4) ignores word boundaries after squashing, so "yp" matches "Disney Plus", "Chewy" and "Perplexity Pro". Finally, `limit` (30) is applied before selected services are filtered out in `add.tsx:40`, so the visible list can hold fewer than 30.
**Why it matters**: Confusing labels for non-English users and noisy results on 2 letter queries. All minor.
**Suggested fix**: If `typed` is non-empty and `query` normalizes to empty, show no results (and the "Add yourself" row). Require a minimum of 3 characters for the squashed contains rank, or only squash within whole-word joins. Filter selected ids before slicing.

### 🟡 Tap targets under 44pt, `src/app/add.tsx:269`, `:304`, `src/components/date-picker.tsx:112`
**Problem**: The catalog "+" button (34), the selected card's remove check (34) and the date picker month arrows (36, no `hitSlop`) are below the 44pt iOS and 48dp Android minimums. The remove control is a check mark that actually removes, which also reads oddly.
**Why it matters**: Mis-taps, especially on the remove control, which discards the selection with no undo.
**Suggested fix**: Add `hitSlop` or enlarge to 44. Give the selected indicator `role="checkbox"` with `aria-checked`, or use a clearer remove glyph.

### 🟡 Fixed heights clip at large font scales, `src/app/add.tsx:233`, `:260`, `:281`, `src/components/date-picker.tsx:136`
**Problem**: Search (52), result rows (64), the "add yourself" row (54), the price field (52) and date cells (44 with a 38pt circle) are fixed heights. At 150%+ system text the two-line row text and the day numbers overflow or clip.
**Why it matters**: Accessibility text sizes break the main list.
**Suggested fix**: Use `minHeight` plus padding for rows and fields. Test with the largest Dynamic Type and Android font scale.

### 🟡 Accessibility details in the picker and sheet, `src/components/date-picker.tsx:36`, `:78`, `src/components/subscription-editor.tsx:397`
**Problem**: Weekday initials are announced as seven loose letters. Day labels ("Sat, Oct 18") omit the year, which matters once the user pages past December. The sheet has two controls named "Close" (backdrop and X). Blocked days use `colors.hairline` text on white (about 1.5:1).
**Why it matters**: Noisy and ambiguous for screen reader users; low-vision users cannot tell past days from future ones.
**Suggested fix**: `aria-hidden` the weekday row, include the year in the aria label, make the backdrop `accessible={false}`/`importantForAccessibility="no"`, and use a token with at least 3:1 contrast for blocked days (or a strikethrough).

### 🟡 Price field has no upper bound and rejects ".99" and "1,299", `src/features/subscriptions/billing.ts:57`
**Problem**: `parsePrice("999999999999999999")` returns `1e20` cents, which then flows into `formatMoney` and monthly maths. ".99", "1,299.50" and "1.299,50" return null and show "Add a price, like 9.99."
**Why it matters**: A typo creates an absurd subscription that breaks layout; users with thousands separators get a vague error.
**Suggested fix**: Cap at something sane (for example 1,000,000.00) and return a specific message. Accept a leading "." and strip thousands separators when both "," and "." appear.

### 🟡 "Add and remind me" promises reminders this change does not schedule, `src/app/add.tsx:151`
**Problem**: Saving only writes to the store. Nothing schedules a notification.
**Why it matters**: The CTA and the editor copy ("We’ll remind you before the first charge") over-promise until the reminder step lands.
**Suggested fix**: Ship the reminder scheduling in the same release, or reword the label to "Add" for now.

### 🟡 No guard against adding the same catalog service twice, `src/app/add.tsx:38`
**Problem**: `selectedIds` only hides services chosen in the current session. Services already saved still appear in Popular and can be saved again, and the store does not dedupe.
**Why it matters**: A returning user ends up with two Netflix rows and double-counted spend.
**Suggested fix**: Mark already-saved services in the list ("Added") or ask before adding a duplicate.

### 🟡 Persisted data is trusted without validation, `src/stores/subscriptions.ts:40`, `src/app/(tabs)/index.tsx:52`
**Problem**: Rehydrated rows are used as-is. A malformed `chargeOn` yields `NaN-NaN-NaN` from `nextChargeDate` and "Invalid Date" on Home; a missing string would throw in `localeCompare`. Hydration errors are marked as hydrated with an empty list, and the next `add` then overwrites the unreadable data.
**Why it matters**: One bad row can take down the Home screen, and a read failure silently turns into data loss on the next write.
**Suggested fix**: Validate or filter rows in `merge`/`migrate`, and on read errors keep the raw value (or avoid writing) instead of overwriting.

## Nits
- ⚪ `src/app/add.tsx:316`, `src/components/subscription-editor.tsx:506`: `rgba(255,255,255,0.45)` and `rgba(20,20,20,0.35)` are hard-coded colors; AGENTS.md asks for tokens. Radii of 16, 14 and 28 and the `fontSize: size * 0.45` in `service-logo.tsx:45` are also literals.
- ⚪ `src/app/add.tsx:91`: `clearButtonMode` is iOS only, so Android has no way to clear the search with one tap.
- ⚪ `src/components/date-picker.tsx:36`: the week always starts on Sunday regardless of locale, and a 100/7 percent cell width relies on Yoga rounding; a fixed `flexBasis` or measured width is safer.
- ⚪ `src/components/service-logo.tsx:15`: logos are trademarked brand marks pulled from simple-icons; fine for identifying a service, but worth a note for App Store review.
- ⚪ `src/stores/subscriptions.ts:13`: `remove` has no caller yet, so there is no way to delete a subscription from the UI.

## What is good
- Date handling is consistent: local `YYYY-MM-DD` strings, anchor-based `addCycles` so months do not drift, `Math.round` in `daysBetween` for DST, and no UTC conversions anywhere.
- `parsePrice` works in integer cents with a strict regex, so there is no float drift for two-decimal input.
- Save is idempotent end to end (`saving` ref on the screen, keyed replace in `saveDraft`), and the layout waits for both stores to hydrate before showing Home.
- Everything uses `role` and `aria-*`, tokens, and Expo Go compatible modules (AsyncStorage, react-native-svg); tests sit outside `src/app/`.

## Resolution

Fixed in the follow-up commit:
- Major, Android keyboard: both KeyboardAvoidingViews use `behavior="height"` on Android. Still needs a check on an Android phone in Expo Go.
- Home's date refreshes at midnight and when the app returns to the foreground (`useToday`).
- Changing how often it charges moves the default date until the person picks one.
- Search: a symbols-only query shows Popular; matching inside a word needs 3+ letters; the 30-result limit applies after picked services are hidden.
- Services already saved say "Already added" (adding a second one stays allowed for two accounts).
- Price accepts ".99" and rejects amounts over $99,999.99.
- Hit slop on the remove check and month arrows; weekday letters hidden from screen readers; the backdrop is no longer a second "Close" button.
- Hard-coded rgba colors moved to `colors.scrim` and `colors.onAccentPanel`.
- The date picker follows its value when it moves to another month.

Deferred:
- Day-of-month anchor for charges set on the 29th to 31st: lands with the reminder scheduler, which needs the same anchor.
- "Add and remind me" promises reminders that arrive with the scheduler step; the label matches the design and stays.
- Persisted data validation and safe handling of a failed read: lands with the SQLite store.
- Sheet slide-out animation, large-font clipping, Monday-first weeks, year in day labels, 1,299 thousands separators, `remove` caller (Subscription detail).
- Logos are simple-icons brand marks, used nominatively to identify each service.
