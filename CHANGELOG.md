# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Moved to Expo SDK 57 so the app opens in the Expo Go version on the App Store.

### Added
- Welcome screen with the lapse. logo, the tagline, the promise that your data stays on the phone, and the mascot peeking in from the bottom-left corner. Tap anywhere to continue.
- Turn on reminders screen: sample reminders, a choice of when to be reminded (3 days before, 1 day before, or the morning of), and a button that asks your phone for permission to send notifications. Skip and Not now finish onboarding with reminders off.
- Onboarding shows only once. Your choice of timing and whether reminders are on are saved on the phone.
- The app shell: charcoal and orange theme, floating tab bar with Home, Calendar, All subscriptions and Profile, and the empty Home screen.
- Automated tests (Jest) for onboarding, the settings store and the permission request.
