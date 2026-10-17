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
