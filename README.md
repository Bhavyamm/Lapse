# lapse.

A subscription and free-trial tracker that reminds you before every charge. Everything stays on the phone: no bank connection, no account.

## Try it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. On your computer, with Node 20 or newer:

   ```bash
   npm install
   npx expo start
   ```

3. Scan the QR code in the terminal with the iPhone camera (or from Expo Go on Android).

If your phone and computer are on different networks, run `npx expo start --tunnel` instead.

## Project layout

| Path | What lives there |
|---|---|
| `src/app/` | Screens. Every file is a route (Expo Router); `_layout.tsx` files define navigators. |
| `src/app/(tabs)/` | The four tabs: Home, Calendar, All subscriptions, Profile. |
| `src/components/` | Shared UI: glass and charcoal cards, floating tab bar, mascot, pill button. |
| `src/theme/` | Design tokens: colors, type scale, radii, spacing. |
| `src/utils/` | Plain helpers with no UI. |

## Design rules

- Font: Bricolage Grotesque. Canvas `#E6E5E7`, charcoal `#232323`, accent `#EE7A3A`.
- Secondary text is `#555555` on light surfaces and never smaller than 13px.
- Light cards are clear Liquid Glass (`GlassCard`); hero cards and the nav stay nearly solid charcoal (`CharcoalCard`).
- The app never shows or asks for card numbers.

## Checks

```bash
npm run typecheck
npm run lint
```
