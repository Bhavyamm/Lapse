# Apple Design Context

## Product
- **Name**: lapse.
- **Description**: An on-device subscription tracker that reminds you before trials end and renewals charge.
- **Category**: Finance / utility
- **Stage**: Development (MVP, tested in Expo Go and development builds)

## Platforms
| Platform | Supported | Min OS | Notes |
|----------|-----------|--------|-------|
| iOS      | Yes       | Expo SDK 57 default | Primary target; phone only (`supportsTablet: false`) |
| iPadOS   | No        |        |       |
| macOS    | No        |        |       |
| tvOS     | No        |        |       |
| watchOS  | No        |        |       |
| visionOS | No        |        |       |

Android ships from the same code; a web build is used only for screenshots and checks.

## Technology
- **UI Framework**: React Native 0.86 with Expo SDK 57 and Expo Router (not SwiftUI or UIKit directly)
- **Architecture**: Single-window, tab bar (Home, Calendar, All subscriptions, Profile) plus stack screens and modals
- **Apple Technologies**: Local notifications, Face ID (expo-local-authentication), Keychain (expo-secure-store), in-app purchase planned (RevenueCat, one-time Pro unlock)

## Design System
- **Base**: Custom design system ("Bold style · charcoal and orange"), tokens in `src/theme/tokens.ts`, shared components in `src/components`
- **Brand Colors**: canvas #E6E5E7, charcoal #232323, ink #141414, accent orange #EE7A3A; secondary text #555555
- **Typography**: Bricolage Grotesque (custom font), 13 pt minimum
- **Dark Mode**: Not yet (`userInterfaceStyle: light`)
- **Dynamic Type**: Partly; text scales with the system setting but layouts are not all tested at large sizes

## Accessibility
- **Target Level**: Enhanced
- **Key Considerations**: VoiceOver labels via `role`/`aria-*` props, Reduce Motion respected for animations, 44 pt touch targets, contrast on orange and charcoal surfaces

## Users
- **Primary Persona**: Someone paying for several subscriptions who wants to catch renewals and free trials before they charge, without linking a bank
- **Key Use Cases**: Add subscriptions from a catalog, see what's due, get reminded, cancel with guided steps, monthly check-in
- **Known Challenges**: Keep screens simple and clearly ordered; strong custom brand look rather than stock iOS
