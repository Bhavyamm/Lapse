# Review, claude/expo-scaffold-4fl2hv, 2026-10-17

**Reviewed by**: Sonnet 5.5 (author model not stated)
**Scope**: 19 files, last 3 commits (`HEAD~3..HEAD`, `package-lock.json` skipped)
**Verdict**: Changes requested

## Summary
The change rebuilds Home (spend card, Needs your attention, Coming up), replaces the welcome screen with a launch splash overlay shown on every launch, and adds the All subscriptions tab with a sort control. The overview math is sound: totals skip running trials, the 7 day window is inclusive and cannot go negative, the date words ("today", "tomorrow", weekday under a week, then a date) are right at every boundary, and sort order is stable with a name tiebreak. The real risks are on the device: the first-launch splash will show dark status bar icons over a dark screen, the overlay leaves the screens beneath it reachable by screen readers, and a few layouts break at large text sizes or with only trials tracked. I read the code and did not run it on a device, so the Android and iOS items are risks to confirm in Expo Go.

## Major
### 🟠 Status bar icons are dark on the dark splash on first launch, `src/app/_layout.tsx:44`, `src/app/reminders.tsx:52`
**Problem**: The root layout sets `<StatusBar style="light">` while the splash shows. On a fresh install the screen underneath is `reminders`, which mounts its own `<StatusBar style="dark" />`. `expo-status-bar` applies the most recently mounted instance, so the splash is drawn over a dark `night` background with dark icons.
**Why it matters**: The clock and battery are unreadable during the splash on a person's very first launch, the one that shapes the first impression. It works on later launches only because the tab screens declare no status bar of their own, which hides the problem in testing after onboarding.
**Suggested fix**: Have the splash own its status bar by rendering `<StatusBar style="light" />` inside `LaunchSplash` (it mounts last, so it wins) and dropping the `splashing` ternary at the root. Confirm the dark style comes back on the reminders screen once the splash unmounts, and check it on iOS and Android.

### 🟠 Screens under the splash stay reachable by VoiceOver and TalkBack, `src/components/launch-splash.tsx:38`, `:39`
**Problem**: The overlay is a sibling after the `Stack`, with no `accessibilityViewIsModal` (iOS) or `importantForAccessibility="no-hide-descendants"` on the content below (Android). Screen reader focus can move into Home or the reminders screen while the splash is visible. The splash itself auto-dismisses after 1.8 seconds, while its single button label is about 20 words long and may not finish being read.
**Why it matters**: A screen reader user can land on, and activate, controls hidden behind the splash (for example "Turn on reminders" on first launch), and the splash disappears mid-announcement. Touch users are protected by the overlay, assistive tech users are not.
**Suggested fix**: Mark the overlay as a modal for accessibility (`aria-modal` on the root `Animated.View`, and `importantForAccessibility="no-hide-descendants"` on the `Stack` wrapper while `splashing`). Skip the timed dismissal, or extend it, when a screen reader is on (`AccessibilityInfo.isScreenReaderEnabled`), and honor `isReduceMotionEnabled` by dismissing without the fade.

## Minor
### 🟡 Only trials tracked shows "$0.00 … across 0 subscriptions", `src/features/subscriptions/overview.ts:45`, `src/app/(tabs)/index.tsx:63`
**Problem**: `count` counts only paying subscriptions, so a person whose first entry is a free trial sees "$0 a year across 0 subscriptions" on the spend card, directly above a card saying their trial ends soon.
**Why it matters**: Reads as a bug on the first real use of the feature (people often add a trial first). `tracked` exists but is not used here.
**Suggested fix**: When `count` is 0 and `tracked` is above 0, use a line such as "Nothing charging yet · 1 free trial running". Add a test for the all-trials case.

### 🟡 "Spending this month" is the monthly equivalent, not this month's charges, `src/features/subscriptions/overview.ts:47`, `src/app/(tabs)/index.tsx:67`
**Problem**: A $120 yearly plan renewing in March adds $10.00 to "Spending this month" in every month, and a weekly plan is smoothed to 52/12 weeks.
**Why it matters**: People will compare the number to their card statement and it will not match. It is a defensible "average cost" figure, but the label promises something else.
**Suggested fix**: Relabel (for example "Costs about this much a month"), or sum the real charges falling in the current calendar month. Either way, settle it before the number is used in notifications or Pro features.

### 🟡 Large text breaks the amount, the sort control and the splash, `src/app/(tabs)/index.tsx:69`, `src/components/segmented.tsx:38`, `src/components/launch-splash.tsx:101`
**Problem**: (a) The spend card amount is a non-wrapping row of 60pt and 26pt text with no `adjustsFontSizeToFit`; at 150%+ system text, "$1,234.56" is wider than a 320pt phone. (b) The segmented track is `alignSelf: 'flex-start'` with three unshrinkable options (14pt padding each); "Next renewal / Price / Name" is about 270pt at normal size and runs off the right edge on a 320pt phone or at larger text, with no scroll or wrap. (c) On the splash, the centre block is padded 170pt from the bottom and the bubble sits about 205pt up; on a 667pt iPhone SE the privacy line and the bubble end up within a few points of each other, and larger text makes them overlap.
**Why it matters**: Clipped totals and an unusable sort control on small phones and for people who raise text size.
**Suggested fix**: Add `adjustsFontSizeToFit` with `numberOfLines={1}` on the dollars, and let the amount row shrink. Make the segmented track `alignSelf: 'stretch'` with `flex: 1` options and `numberOfLines={1}`/`adjustsFontSizeToFit` labels, or allow it to scroll horizontally. For the splash, size the mascot and bubble from `useWindowDimensions` height and verify on a 4.7 inch phone at the largest text.

### 🟡 Touch targets and semantics below the bar, `src/components/segmented.tsx:44`, `src/app/(tabs)/index.tsx:115`
**Problem**: Each segmented option is 36pt high (the 4pt track padding is not tappable) and has no `hitSlop`. The "See all" link is a 13pt caption with `hitSlop={10}`, about 38pt high, and has no `aria-label`, so a screen reader announces only "See all, link" with no target.
**Why it matters**: Below the 44pt iOS and 48dp Android minimums; "See all" is ambiguous when swiped past.
**Suggested fix**: Raise the option `minHeight` to 44 (and shrink the track padding) or add `hitSlop`. Label the link "See all subscriptions". The `radiogroup`/`radio` + `aria-checked` semantics themselves are right; consider also exposing the group label to TalkBack by testing it on a device.

### 🟡 Trial card on Home looks tappable but does nothing, `src/app/(tabs)/index.tsx:92`, `:102`
**Problem**: `TrialCard` draws a round chevron button but is a plain `View` with no `onPress`.
**Why it matters**: The alert is the main call to action on the screen, and tapping it does nothing.
**Suggested fix**: Either make it a `Pressable` (to the subscription once a detail screen exists, or to `/subscriptions`) with `role="link"`, or drop the chevron until there is somewhere to go.

### 🟡 Home date header and rows can disagree with `useToday`, `src/app/(tabs)/index.tsx:29`
**Problem**: The eyebrow uses `formatToday()` from the render time, while the dashboard uses `useToday()`, which re-renders at midnight and on foreground. `HomeScreen` itself does not subscribe to the hook, so after midnight the rows move on and the header still shows yesterday until something else re-renders `HomeScreen`.
**Why it matters**: "Thursday, Oct 16" above a list that has already rolled to the 17th.
**Suggested fix**: Call `useToday()` in `HomeScreen` and format the eyebrow from that date (`fromLocalDate`).

### 🟡 `onDone` is a new function every render, so the fade can restart, `src/app/_layout.tsx:54`, `src/components/launch-splash.tsx:30`
**Problem**: The inline `() => setSplashing(false)` changes identity on every `RootLayout` render, and the fade effect lists `onDone` as a dependency. Any re-render during the 250ms fade (a store hydration update, a settings change) cancels the running animation and starts a new 250ms one. It is harmless today but fragile; the first run's callback is dropped because `finished` is false.
**Why it matters**: Extra delay or a visible stutter if anything ever re-renders the root while the splash is leaving.
**Suggested fix**: Wrap the callback in `useCallback`, or keep `onDone` in a ref inside `LaunchSplash` so the effect depends only on `leaving`. Stop the animation in the effect cleanup.

### 🟡 Tests do not cover the new edge cases, `src/features/subscriptions/overview.test.ts`, `src/__tests__/subscriptions-list.test.tsx`
**Problem**: `TEST_SIGNAL = configured`. Missing: a list of only trials (count 0 and the card text), a trial ending today, the exact 7 and 8 day boundary, a trial whose date is past (becomes a normal renewal and joins the totals), month and yearly total rounding for weekly plans, `Segmented` selection and `aria-checked`, and the splash tap during the fade. The splash tests mock timers well but not the status bar interaction.
**Why it matters**: These are the branches where the totals and alerts go wrong silently.
**Suggested fix**: Add cases for the above; a small `Segmented` test that asserts `aria-checked` flips on press.

## Nits
- ⚪ `src/app/(tabs)/subscriptions.tsx:93`, the `$0` on trial rows is hard coded; use `formatMoney(0)` so it follows any later currency work.
- ⚪ `src/components/launch-splash.tsx:46`, gradient ids are still `welcomeBg`/`welcomeGlow`; rename for the splash.
- ⚪ `src/app/(tabs)/subscriptions.tsx:42`, the eyebrow says "N tracked" including trials but the dollar figure excludes them; fine, but say "N tracked · $X a month for paid" if people question it.
- ⚪ `src/components/subscription-row.tsx:23`, the row is a bare `View`; wrap name, cycle, price and date in one `accessible` element with a joined label so a screen reader reads one row per swipe.

## Strengths
- `buildOverview` is a pure function with the trial rule stated in one place (`next === chargeOn`), and the attention list, Coming up and totals are all derived from it, so they cannot disagree.
- Date words are correct at the boundaries (0, 1, 2 to 6, 7 days), and day counts use local midnight with rounding, so DST does not shift them.
- `useToday` refreshes on foreground and at midnight, and both new screens use it.
- The splash cleans up its timer, guards `onDone` with `finished`, and the existing tests prove it completes exactly once when tapped.
- Role and `aria-*` props are used throughout (no `accessibilityRole`), and `AddButton` is a 48pt target.

## Test coverage
Jest is configured. Covered: totals, weekly and yearly spreading, the attention window and its exclusions, date words, all three sorts with trials pinned, empty and populated screens, and the splash timer and tap. Not covered: the items listed in the last Minor above, and anything native (status bar, accessibility focus, large text), which `/check verify` on a device should exercise.

## Resolution

Fixed:
- Major, splash status bar: `LaunchSplash` renders its own light `StatusBar`, which wins over the screens' dark one until it closes.
- Major, splash accessibility: the overlay is `aria-modal`, the screens under it are hidden from screen readers while it shows, it waits for a tap when a screen reader is on (not on web, where react-native-web always reports one), and it skips the fade with Reduce Motion.
- Only free trials tracked now reads "Nothing charged yet, only free trials".
- Home's date uses `useToday`, so it refreshes after midnight.
- "See all" has the label "See all subscriptions" and a larger hit area; segmented options get extra vertical hit slop.
- `onDone` is a stable callback, so a root re-render can't restart the fade.
- Tests for the only-trials case, a trial ending today, screen reader and Reduce Motion.

Deferred:
- The trial card's chevron opens the Trial screen once it exists (next screens).
- "Spending this month" stays the monthly-equivalent cost, as the design's $74.46 is.
- Large-text layout of the 60pt amount and the segmented control: with the accessibility pass.
