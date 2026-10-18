# Review, Renewal and trial reminders (commit 25f99d5), 2026-10-17

**Reviewed by**: Sonnet 5.5 (author model: Opus 5.5)
**Scope**: 10 files, `git show HEAD` (`reminders/plan.ts`, `reminders/sync.ts`, `components/reminders.tsx`, root layout mount, `trialKept` and `snoozeUntil` fields, dev-only "Send a test reminder" on Profile, tests)
**Verdict**: Changes requested

## Summary
The structure is sound: `planReminders` is pure and stable-id'd, the sync queue serializes runs and never throws, the handler and category are registered once, `Reminders` is mounted only after both stores hydrate (so a cold-start tap never reads an empty store), the web guard sits before any hook, and `useLastNotificationResponse` plus `clearLastNotificationResponse` behave as the .d.ts describes (clearing emits the cleared event, the hook goes to `null`, and the `handled` set stops a second run). Date math uses local midnight plus `setHours(9)` and cycle counts from the anchor, so DST and month ends are fine. `tsc`, lint and all 199 tests pass. The real problems are: a trial added inside its lead window gets no reminder at all, "I'll keep it" silently survives editing the trial, the 60 cap can drop a trial reminder in favour of earlier renewals, and "Remind me tonight" can promise a reminder the planner then discards. I read the code and the library sources and did not run it on a device.

## Critical
None.

## Major
### 🟠 A trial that is already inside its lead window gets no reminder, `src/features/reminders/plan.ts:90-91`
**Problem**: Each charge gets exactly one reminder at `reminderAt(on, lead)`; if that time is past, the charge is skipped (`if (at.getTime() <= now.getTime()) continue`). With the default or a 3-day lead, adding a trial that ends in 2 days (or tomorrow) means the 9 AM three days before is already gone, so nothing is scheduled, and the same for "Morning of" when the person adds a trial after 9 AM on its last day. The existing test ("skips reminders whose time has passed") encodes this for renewals, but for a trial this is the exact moment the app is needed most: people add a trial the day they sign up, and a 3-day trial or a "ends Saturday" one added on Thursday is the common case.
**Why it matters**: The headline feature silently does nothing for the trials closest to charging.
**Suggested fix**: For `trialEnding` charges, when the lead time has passed but the charge day has not, fall back to the next sensible moment (for example 20 minutes from `now` if before 9 AM on the charge day, else `tonight(now)`; skip once the day is over) and build the wording from that time (`reminderContent` already does). Add plan tests for a trial ending tomorrow with `threeDays`, and a trial ending today at 2 PM with `morningOf`.

### 🟠 "I'll keep it" and "Remind me tonight" outlive an edit of the trial, `src/components/reminders.tsx:75`, `:82`, `src/features/reminders/plan.ts:89`, `src/features/subscriptions/draft.ts:85-96`
**Problem**: `toNewSubscription` carries only the editable fields and the store's `update` merges, so `trialKept` and `snoozeUntil` are never reset by an edit. Path: tap "I'll keep it" on a trial (`trialKept: true`), then open Edit and change the end date (the trial was extended, or it was entered wrongly) or turn Free trial off and on again. `plan.ts:89` still skips the trial reminder for the new date, so the new trial end is never announced. The same applies when the person keeps the first trial, cancels it, and later adds the service again as a new subscription (new id, fine) versus edits it in place (kept flag stays). A snooze set for 8 PM is likewise left as is when the end date moves.
**Why it matters**: This is the "stale trialKept after edits" path: the person decided about one trial end, and the app applies it to a different date for good.
**Suggested fix**: Tie the flag to the date it was set for. Store `trialKept` as the `chargeOn` it applies to (or store `trialKeptFor: LocalDate` and compare with `charge.on`), and do the same for `snoozeUntil`. Alternatively clear both in the editor save when `chargeOn` or `trial` changed. Add a plan or editor test: keep, change `chargeOn`, expect a trial reminder again.

### 🟠 The 60 cap can drop a trial reminder for earlier renewals, `src/features/reminders/plan.ts:102`
**Problem**: Everything is sorted by time and cut at 60, with no priority. Weekly subscriptions produce 13 reminders each in 90 days, so 5 weekly plus a dozen monthly subscriptions already pass 60 charges; a trial ending around day 70 is then the 61st and is never scheduled. It gets topped up only when the person opens the app inside the window where it fits. If they do not open lapse for a few weeks (the very reason they rely on reminders), the trial charge arrives with no reminder.
**Why it matters**: Trial reminders save money; weekly renewals are noise by comparison, and the cap is what the code uses to protect against exactly that.
**Suggested fix**: Reserve slots: take all trial and snooze reminders first (they are few), then fill the rest with renewals by time, then sort the result. Test: 70 weekly renewals plus one trial at day 85 keeps the trial.

## Minor
### 🟡 "Remind me tonight" can promise a reminder that is then dropped, `src/components/reminders.tsx:72-78`, `src/features/reminders/plan.ts:96-98`, `:110`
**Problem**: The button handler sets `snoozeUntil` and shows "We'll remind you about X at 8:00 PM" without checking the plan. `planReminders` discards the snooze when the local day of `snoozeUntil` is after `sub.chargeOn`, when `trialKept` is set, or when `sub.trial` is false. Concrete paths: (a) a reminder delivered Friday for a trial ending Saturday is tapped on Sunday from the lock screen (it stays in the list), where the trial is over and the toast still promises a reminder; (b) `tonight` returns `now + 1h` when 8 PM is within 15 minutes or gone, so at 11:30 PM on the trial's last day the snooze lands after midnight, `toLocalDate(snoozeUntil) > chargeOn`, and it is silently dropped.
**Why it matters**: A wrong confirmation on a money-saving flow.
**Suggested fix**: In the handler, use `trialRunning` and the planner's rule (a shared `snoozeAllowed(sub, at)` exported from `plan.ts`) and say "That trial has already ended." otherwise. Cover both paths with tests.

### 🟡 `prepare()` swallows its failure and sync carries on without the handler or buttons, `src/features/reminders/sync.ts:17-41`, `:55-56`
**Problem**: The `.catch` resets `prepared = null` but resolves, so `syncReminders` continues, schedules notifications with `categoryIdentifier: 'trial'` that was never registered (no buttons on the lock screen), and `setNotificationHandler` may not have run (a reminder arriving while the app is open is not shown). It retries on the next sync, but the reminders scheduled meanwhile stay as scheduled until then. On Android, a failed `setNotificationChannelAsync` also means every `channelId: 'reminders'` trigger points at a channel that does not exist.
**Why it matters**: Trial reminders without the Cancel and Keep buttons are a quiet downgrade of the main design.
**Suggested fix**: Let `prepare` reject (keep the `prepared = null` reset), and have `run` return early on rejection so the old schedule stays and the next change or app open tries again; call `setNotificationHandler` before the awaits so it is set even when the channel call fails.

### 🟡 Cancel-all then schedule leaves a window with no reminders, `src/features/reminders/sync.ts:59-70`
**Problem**: Each sync calls `cancelAllScheduledNotificationsAsync()` and then awaits up to 60 `scheduleNotificationAsync` calls one by one. If the app is suspended or killed in between (iOS gives about 5 seconds in the background, and the sync runs on every store change plus foreground), the person is left with a partial schedule. Soonest-first order means the later ones go missing, and nothing retries until the next app open. A test reminder from Profile (`sendTestReminder`) is also wiped by any sync inside its 5 seconds.
**Why it matters**: The schedule is the product; losing it has no visible symptom.
**Suggested fix**: Schedule first, then cancel only identifiers that are no longer planned (`getAllScheduledNotificationsAsync`, compare `identifier`, cancel the difference). Stable ids already make re-scheduling an in-place replace. Also skip the work when the plan is unchanged.

### 🟡 Android reminders can arrive late without the exact-alarm permission, `app.json:36-47`, `src/features/reminders/sync.ts:60-70`
**Problem**: `app.json` has no `expo-notifications` plugin entry or `SCHEDULE_EXACT_ALARM`; `ExpoSchedulingDelegate.kt:106` only uses an exact alarm when `canScheduleExactAlarms()` is true on Android 12+, otherwise an inexact one that Doze can defer. The "9:00 AM" and the 8 PM snooze can arrive many minutes late; a trial ending "tomorrow" is fine, "today" less so.
**Why it matters**: Slight, but time-of-day is a visible promise ("9:00 AM" shows on the Trial screen).
**Suggested fix**: Decide deliberately: either declare the permission through the plugin for development builds, or make the Trial screen and notes say "around 9 AM". Add the `expo-notifications` plugin (default channel, icon, color) before the first development build.

### 🟡 Test gaps on the risky parts, `src/__tests__/reminders.test.tsx`, `src/features/reminders/sync.test.ts`
**Problem**: Nothing exercises `useReminderResponses`: not that a cold-start response waits for `hasOnboarded` and navigation readiness, not that the same response is handled once, and not that `clearLastNotificationResponse` is called. `handleResponse` tests run with the clock at 9:00 and never cover a trial that has ended, `tonight` after midnight, or a missing `data`. `sync.test.ts` does not cover the `prepare` failure path or the Android channel call. The plan tests do not cover the cap with trials, an edited trial with `trialKept`, or a trial inside its lead window (the findings above).
**Why it matters**: These are the branches where the bugs above live.
**Suggested fix**: Render `Reminders` with `useLastNotificationResponse`, `useRootNavigationState` and `useSettings` mocked, assert one `router.push` per response and none before onboarding; add the plan and sync cases listed above.

## Nits
- `src/features/reminders/plan.ts:52`: the renewal body prints `formatShortDate` ("Sun, Oct 19"), while the design shows "renews Oct 19"; use `formatMonthDay` so the body does not repeat the weekday already in the title.
- `src/features/reminders/sync.ts:20-24` and `src/features/reminders/permissions.ts:18-24`: the channel is created in two places with the same options; export one `ensureReminderChannel()` so they cannot drift.
- `src/components/reminders.tsx:56-58`: the `handled` set is redundant once `clearLastNotificationResponse` runs (the hook returns `null` afterwards), and it grows for the life of the app; harmless, but one of the two can go. `clearLastNotificationResponse` throws `UnavailabilityError` on a native module without it, which would skip `handleResponse`; call it after `handleResponse` inside a try/catch.
- `src/features/reminders/sync.ts:84-98`: `sendTestReminder` copies a real subscription's data, so tapping "I'll keep it" on the test sets `trialKept` on the real subscription; fine in development, but say so in the comment or use a `test: true` flag that `handleResponse` ignores.

## Resolution

Fixed:
- Major, trial inside its lead window: a reminder whose lead time has passed falls back to the next 9 AM up to the charge day, so a trial added two days before it ends with a 3-day lead is reminded at the next 9 AM.
- Major, stale `trialKept`/`snoozeUntil`: the store's `update` drops both when `chargeOn` or `trial` changes.
- Major, the cap: trial reminders are kept first, then renewals fill the rest of the 60.
- "Remind me tonight" with no time left (trial over, or the fallback past its last day) opens the detail screen instead of promising a reminder; the planner uses the same `snoozeFits` check.
- `prepare()` rethrows, so a sync waits for the next try instead of scheduling without the buttons or channel.
- Sync no longer cancels everything first: it cancels only reminders no longer planned and reschedules by identifier, so there's no empty window, and the dev test reminder survives a sync.
- Nits: renewal body reads "renews Oct 19"; the test reminder is tagged so its buttons don't change the real subscription; `clearLastNotificationResponse` is guarded.
- Tests for each, plus `Reminders` mount sync, navigation-ready and onboarding gates, and handling a tap once: 208 passing.

Deferred:
- Android exact alarms (`SCHEDULE_EXACT_ALARM`) and the `expo-notifications` config plugin: they only matter in a development build; inexact delivery is minutes late at worst, fine for a day-ahead reminder. Revisit with the dev build for SQLCipher and RevenueCat.
- The Android channel is still created in both `permissions.ts` and `sync.ts`; both calls are idempotent.
