# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- The splash keeps a light status bar, waits for a tap when a screen reader is on, and skips the fade with Reduce Motion.
- Spending totals on Home leave out free trials that haven't charged yet, matching the design.
- The lapse. splash now shows each time the app opens and fades into Home (or into Turn on reminders the first time) after a moment; tap it to skip. It is no longer an onboarding step.
- Calmer background: one warm glow at the top right and a faint gray one at the bottom left, and it now fills the whole screen on iPhone (it was cut off at the right and bottom).
- Turn on reminders shows a single sample reminder and a shorter line of text, so the screen is less busy.
- Moved to Expo SDK 57 so the app opens in the Expo Go version on the App Store.

### Added
- Pro unlock: Unlock Pro on Profile (and statement import) opens the Pro screen with the one-time $14.99 offer, what Pro adds and Restore purchase. Buying opens with the App Store release; until then the button says Pro isn't on sale yet.
- Monthly check-in: once a month lapse walks you through your paid subscriptions, one card at a time with its yearly cost. Keep it, cancel it (opens the cancel steps) or put it off to next month. Home shows a Monthly check-in row while any are waiting, Profile opens it any time, and a reminder comes at 9 AM on the 1st.
- Reminders: lapse now schedules real reminders on the phone at 9 AM before each renewal and before a free trial ends, at the timing you picked (or the next morning if that has passed). Trial reminders have Cancel the trial, Remind me tonight (8 PM) and I'll keep it buttons; tapping a reminder opens the trial or the subscription. Turning reminders off on Profile, or a subscription's alert off, removes them.
- Trial reminder: tap a free trial on Home or All subscriptions to see how many days are left, when the first charge comes and what keeping it costs a year. Pick when this trial's reminder comes (3 days before, 1 day before or the morning of), then tap Cancel before to get the cancel steps, or I'll keep it.
- Subscription detail: tap any subscription or trial to see its price, next renewal, yearly cost and how to cancel it. A button opens the cancel page (Netflix, Spotify, YouTube), your App Store or Google Play subscriptions, or a web search when the steps aren't known. Turn the renewal alert off for one subscription, edit its details, or tap I already cancelled to record the saving on Profile.
- Profile: money saved from subscriptions you cancel in the app (counted once the Subscription detail screen can cancel), with tracked, cancelled and trials-caught counts. A Reminders sheet turns reminders on or off and picks how early they come. A Face ID lock asks for Face ID when the app opens or comes back, and hides the app in the app switcher. Export as CSV sends everything you track to Files, Mail or any app. Unlock Pro and statement import say Pro is coming.
- Calendar: each month's renewals on a grid, with a dot on renewal days, the day a free trial ends in orange and today outlined. The header shows what is still to pay this month or what is due in a later month, and a list below shows the next charges. You can look up to 11 months ahead.
- All subscriptions: everything you track with the count and monthly total, running free trials on top in orange, and the rest sorted by next renewal, price (per month, highest first) or name.
- Add a subscription: search 145 popular services with their logos, pick one or more, and set the price, how often it charges, whether it is a free trial, and the next charge date. Anything not listed can be added by hand.
- Home with subscriptions, as designed: a Spending this month card with the yearly total, Needs your attention for free trials ending within a week, and Coming up with the next four charges and See all. Subscriptions are saved on the phone.
- Welcome screen with the lapse. logo, the tagline, the promise that your data stays on the phone, and the mascot peeking in from the bottom-left corner. Tap anywhere to continue.
- Turn on reminders screen: sample reminders, a choice of when to be reminded (3 days before, 1 day before, or the morning of), and a button that asks your phone for permission to send notifications. Skip and Not now finish onboarding with reminders off.
- Development builds only: a "Show onboarding again" button on Profile brings the welcome screen back for testing. It is not in release builds.
- Onboarding shows only once. Your choice of timing and whether reminders are on are saved on the phone.
- The app shell: charcoal and orange theme, floating tab bar with Home, Calendar, All subscriptions and Profile, and the empty Home screen.
- Automated tests (Jest) for onboarding, the settings store and the permission request.
