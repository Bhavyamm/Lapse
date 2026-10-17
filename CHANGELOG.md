# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Calmer background: one warm glow at the top right and a faint gray one at the bottom left, and it now fills the whole screen on iPhone (it was cut off at the right and bottom).
- Turn on reminders shows a single sample reminder and a shorter line of text, so the screen is less busy.
- Moved to Expo SDK 57 so the app opens in the Expo Go version on the App Store.

### Added
- Add a subscription: search 145 popular services with their logos, pick one or more, and set the price, how often it charges, whether it is a free trial, and the next charge date. Anything not listed can be added by hand.
- Home lists your subscriptions under Coming up, soonest charge first, with a + button to add more. Subscriptions are saved on the phone.
- Welcome screen with the lapse. logo, the tagline, the promise that your data stays on the phone, and the mascot peeking in from the bottom-left corner. Tap anywhere to continue.
- Turn on reminders screen: sample reminders, a choice of when to be reminded (3 days before, 1 day before, or the morning of), and a button that asks your phone for permission to send notifications. Skip and Not now finish onboarding with reminders off.
- Development builds only: a "Show onboarding again" button on Profile brings the welcome screen back for testing. It is not in release builds.
- Onboarding shows only once. Your choice of timing and whether reminders are on are saved on the phone.
- The app shell: charcoal and orange theme, floating tab bar with Home, Calendar, All subscriptions and Profile, and the empty Home screen.
- Automated tests (Jest) for onboarding, the settings store and the permission request.
