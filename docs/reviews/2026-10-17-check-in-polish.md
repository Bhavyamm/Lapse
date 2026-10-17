# Review, Check-in polish (commit 19dbdec), 2026-10-17

**Reviewed by**: Sonnet 5.5 (author model: Opus 5.5)
**Scope**: 9 files, `git show HEAD` (`src/app/check-in.tsx` RisingCard/SwipingCard/Finished/Celebrate, `src/components/confetti.tsx`, `src/components/fade-footer.tsx` used on `src/app/subscription/[id].tsx`, `src/hooks/use-reduce-motion.ts`, the `canvasClear` token, the expo-notifications plugin and `assets/images/notification-icon.png` in `app.json`, `check-in.test.tsx`)
**Verdict**: Changes requested

## Summary
The swipe is built soundly: the leaving card is a snapshot of the subscription before the answer, `key` makes each swipe a fresh animation, `onDone` goes through a ref and is guarded by the key so a stale callback cannot clear a newer card, the leaving card is `pointerEvents="none"` and hidden from screen readers, Reduce Motion skips the swipe, and the Finished rows handle Kept, Cancelled (gone from the list but present in `cancelled`) and deleted (no row) correctly. The notification icon is a valid 96x96 white-on-transparent PNG and the plugin colour equals `brand.orange`. `tsc` and lint are clean and all 9 check-in tests pass. The problems are layout and finish: the check-in screen has no scrolling and is about 13-50 pt too tall for a 667 pt phone, the flat-canvas fade footer will show as a band over the glowing `ScreenBackground`, the three-up tally breaks words on narrow phones, and Reduce Motion users still get the entry animations. A fast second tap also kills the first swipe. I read the code and ran the tests; I did not run it on a device, and heights are computed from the styles.

## Critical
None.

## Major
### 🟠 The check-in screen is taller than a small phone and cannot scroll, `src/app/check-in.tsx:67-128`, `:438-467`
**Problem**: The screen is a fixed column: top inset + 8, close row 44, heading 37 (74 if "Still using this?" wraps at 36 pt on a 320-360 pt phone or at large text), card stack 6 + 380, action row about 101 (76 button + 8 + caption), bottom inset + 24, plus four 20 pt gaps. On an iPhone SE (667 pt, 20 pt status bar, no home indicator) that is about 680 pt, 13 pt too tall; with a wrapped heading about 717 pt, and a 640 dp Android phone is worse. The column is not scrollable and `actions` only uses `marginTop: 'auto'`, so the overflow clips the bottom of the Keep/Next month/Cancel row (their captions first, then the buttons). The stack height (380) and card height (350) are fixed, so a long note ("Cancelling would bring your savings to $1,234.56 a year from now.") or large text also overflows the card: `card` has `justifyContent: 'space-between'` and no clipping or scroll.
**Why it matters**: These three buttons are the whole screen; on a small phone one is cut off or the caption is gone.
**Suggested fix**: Derive the stack height from `useWindowDimensions` (for example `Math.min(380, height - fixed parts)`), or wrap the content in a `ScrollView` with the actions pinned below it, and drop the heading to one line with `adjustsFontSizeToFit` or `numberOfLines`. Cap `maxFontSizeMultiplier` on the card text or let the card grow with `minHeight`. Add a test that renders at a short window and checks the actions are reachable, or at least check the layout in the web build at 375x667.

### 🟠 The fade footer is a flat canvas panel over a glowing background, `src/components/fade-footer.tsx:11-17`, used at `src/app/subscription/[id].tsx:177` and `src/app/check-in.tsx:363`
**Problem**: The gradient fades to the flat `colors.canvas`, but `ScreenBackground` draws a warm orange radial glow at the top right and a cool glow at the bottom left (`opacity 0.22`, radius 0.9 x width) on top of that canvas. Under the footer the real background is canvas plus the cool glow, so the opaque canvas stops (30%-100% of the footer, which is the button area) are a visibly different tint from the screen around them: a lighter rectangle behind the buttons and, since the top 30% is clear, a soft edge. It is most visible at the bottom left and on a Liquid Glass device, where the glow is what the cards refract. The Finished screen has the same footer.
**Why it matters**: The footer is meant to read as a calm fade; instead it can read as a pasted box.
**Suggested fix**: Check it on a device. If it shows, fade with a lower end opacity (for example `rgba(230,229,231,0.85)`) or draw the same glow in the footer, or put the buttons on a blurred (`expo-blur`) panel. Alternatively give the footer a shared `ScreenBackground`-aware gradient.

## Minor
### 🟡 A fast second tap erases the first swipe and answers a card still rising, `src/app/check-in.tsx:57-63`, `:144-157`
**Problem**: `answer` is allowed while `leaving` is set. The next card starts at opacity 0 with a 90 ms delay, so a quick second tap answers a card the person has barely seen. It also replaces `leaving` with a new `key`, which unmounts the first `SwipingCard` mid-flight, so that card vanishes instead of flying off. The stale `onDone` is harmless thanks to the key check (good), but nothing stops the animation on unmount (`SwipingCard` has no cleanup, so the timing keeps running and calls `done.current()` with `finished: false`).
**Why it matters**: Double taps are common on big round buttons, and the answers are real writes (`reviewedOn`/`skippedOn`).
**Suggested fix**: Ignore `answer` until the rising card has settled (a `busy` ref cleared in `SwipingCard`'s `onDone`, or `RisingCard`'s spring callback), or keep a list of leaving cards instead of one. Stop the animation in an effect cleanup and only call `done` when `finished` is true. Test: press Keep it twice quickly and assert both subscriptions get exactly one answer, and that the first card is not removed until its animation ends.

### 🟡 Reduce Motion users still get the entry animations, `src/hooks/use-reduce-motion.ts:6-9`, `src/app/check-in.tsx:90`, `:144-147`
**Problem**: The hook starts `false` until `isReduceMotionEnabled()` resolves, and `RisingCard` reads `animate` only in its `useState` initializer. The first card is mounted on the first render, so a Reduce Motion user sees it rise, scale and fade in every time the check-in opens. Pressing a button before the promise resolves also swipes. `Celebrate` is safe (it mounts later). The spring also runs even when `animate` is false (a no-op from 1 to 1, but it does run).
**Why it matters**: Reduce Motion exists for people who can be made unwell by this motion, and the first thing they see is a scale and slide.
**Suggested fix**: Render the first card without animation (animate only cards that mount after the first answer, for example `animate={!reduceMotion && answeredCount > 0}`), or delay the first frame until the hook has answered. Skip `Animated.spring` when `!animate`. Use the web `matchMedia` fallback if `AccessibilityInfo` is not enough on web.

### 🟡 The three-up tally breaks words on narrow phones, `src/app/check-in.tsx:326-330`, `:545-551`
**Problem**: Each tally item is `flex: 1` with 14 pt side padding inside a card with 22 pt padding and 20 pt screen padding. On a 320 pt phone the item is about 73 pt wide, leaving about 45 pt for the label; "Cancelled" and "Next month" at caption size are about 52-62 pt, so they wrap mid-word ("Cancelle/d") or the caption is cut. At 360 pt it is borderline, and larger text breaks it on every phone.
**Why it matters**: The tally is the main summary; broken words look like a bug.
**Suggested fix**: Reduce the padding to 10, use `adjustsFontSizeToFit`/`numberOfLines={1}` on the label, or let the tally wrap to two rows when `fontScale > 1.2`. Check at 320 and 375 pt.

### 🟡 The fade footer's top padding blocks scrolling, `src/components/fade-footer.tsx:5-9`, `:21-30`
**Problem**: The footer is a plain absolute `View` with 36 pt of top padding. Only the gradient is `pointerEvents="none"`; the container itself still receives touches, so a drag that starts in the fade area (the strip right above the buttons) does not scroll the list under it. The detail and Finished lists lose a 36 pt dead strip across the full width.
**Why it matters**: Fingers rest near the bottom, so people notice a list that "sticks" there.
**Suggested fix**: Pass `pointerEvents="box-none"` on the footer container so only the buttons take touches.

### 🟡 Finished shows "All checked" with the "Add a subscription" copy when every row is gone, `src/app/check-in.tsx:286-292`, `:304-309`
**Problem**: If the whole queue was deleted (or all answered then removed) `rows` is empty but `ids.length` is not, so the heading says "All checked" and the body says "Add a subscription and it shows up here next month." The confetti and mascot celebrate (`Celebrate` always draws `Confetti`; only the spring is skipped when `rows` is empty) and there is also no row or card, so the person sees a celebration for nothing. The empty-queue case ("Nothing to check") also shows confetti.
**Why it matters**: Wrong copy on an edge path, and a party for no result.
**Suggested fix**: Use the `ids.length`/`rows.length` pair: "Nothing left to check" for the deleted case, and render `Confetti` only when `rows.length > 0`. Test the all-deleted case.

### 🟡 Nothing tells a screen-reader user the card changed, `src/app/check-in.tsx:57-63`, `:73-79`
**Problem**: After Keep it/Next month the card, the "n of N" count and the heading content swap, but there is no announcement or focus move, and on the last answer the pressed button unmounts (the actions row is removed once `sub` is gone) so focus is lost while the card is still flying. The next card's label is only read if the person swipes to it. The "n of N" pill also has no label saying what it counts ("2 of 5" is read bare).
**Why it matters**: A VoiceOver/TalkBack user cannot tell their answer worked or what comes next.
**Suggested fix**: Call `AccessibilityInfo.announceForAccessibility` with the result and the next name ("Kept. Next: ChatGPT, 2 of 5"), and move focus to the Finished heading when it appears (`AccessibilityInfo.setAccessibilityFocus`). Give the count `aria-label="Subscription 2 of 5"`.

### 🟡 Test gaps, `src/__tests__/check-in.test.tsx`
**Problem**: Not covered: a quick second press during a swipe; the "Next month" row/pill in the results list and the `later` tally; more than one cancelled (the plural `By cancelling 2 subscriptions`) and the singular `On the one you kept`; a cancelled item that was also answered; all items deleted; the `Cancel it` path while a card is leaving; `useReduceMotion` itself (the `reduceMotionChanged` event, a rejected promise, unsubscribe on unmount); `FadeFooter`; and the layout at a short window. The Reduce Motion test only checks the old card is gone, not that the flow ends in Finished. The suite also logs four `not wrapped in act(...)` errors from the store updates at `check-in.test.tsx:94` and `:108`, so real errors would hide in that noise. The new swipe test relies on `includeHiddenElements` defaults, which is fine, but never asserts the `aria-hidden`/`pointerEvents` of the leaving card.
**Why it matters**: The double-tap and Finished-row logic are the parts most likely to break.
**Suggested fix**: Add those cases, wrap the store calls in `act`, and add a small `use-reduce-motion.test.ts`.

## Nits
- `src/app/check-in.tsx:183-190`: `pointerEvents` as a prop is deprecated in React Native Web (use `style.pointerEvents`); `FadeFooter` and `Confetti` have the same. `importantForAccessibility` is Android only; `aria-hidden` covers iOS and web, so this is fine, but note both are needed.
- `src/components/confetti.tsx:8`, `:30`: the viewBox is 300 x 190 but `Celebrate` passes `height={176}`, so the art is letterboxed by 14 pt; use a matching height (or `preserveAspectRatio="xMidYMid slice"`). White confetti dots on the light canvas (`colors.white` at `:14`, `:18`) are barely visible.
- `src/app/check-in.tsx:299`: `marginBottom: -bottom` plus `marginHorizontal: -20` relies on the parent's padding values; it works, but a comment pointing at `styles.screen` would stop a future padding change from breaking the footer.
- `src/app/check-in.tsx:60`: `reduceMotion` is read at tap time, so changing the setting mid-session (the hook subscribes to the change) only affects later swipes; fine, just worth knowing.
- `src/hooks/use-reduce-motion.ts:14`: `.then((on) => active && setReduce(on))` is an expression statement; use an `if` to stay clear of `no-unused-expressions`.
- `app.json:55`: the notification `color` is the literal `#EE7A3A` (equal to `brand.orange`); app.json cannot import tokens, so add a comment in `tokens.ts` that it is mirrored there. Not visible in Expo Go; it only takes effect in a development build.

## Resolution

Fixed:
- Major, small phones: the card stack grows to the designed 380 pt and shrinks to 300 pt, so the buttons stay on screen. Checked in the web build at 375 × 647 (iPhone SE less its status bar).
- Fast second tap: taps are ignored while a card is still swiping (a ref, so two taps in one frame are caught), and the swipe stops if the screen closes. Test added.
- Reduce Motion answering late: the rising card and the mascot jump into place when it turns on after mount.
- Tally labels shrink to fit one line instead of breaking mid-word.
- The fade footer passes touches through its fade (`box-none`).
- All deleted: the finish says "Nothing to check" with no confetti. Test added.
- Screen readers hear "Kept ChatGPT. Next: YouTube Premium" (or "All checked") on each answer.
- Tests for the Next month row, the double tap and all deleted: 12 check-in tests.

Kept as is:
- Major, fade band over the glows: checked in the web screenshots of the detail and the finish at 402 × 790; the glows are at the top right and bottom left, and the fade only covers the last ~100 pt where the gray glow is faint, so no band shows. Revisit if a device screenshot shows one.
