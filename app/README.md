# Lipidly app

React Native (Expo SDK 57, Expo Router) app. The backend isn't connected yet: sign-in, report reading and prescription reading are mocked, and all data is stored on the device.

## Run

From the repo root, install once:

```sh
npm install
```

The app uses native modules (camera, notifications, date picker), so it runs as a **development build**, not in Expo Go.

**iOS Simulator**

```sh
cd app
npx expo run:ios            # builds and installs the dev client, then starts Metro
```

**Your iPhone** (USB or same Wi-Fi)

1. Connect the iPhone, unlock it and trust the Mac. Turn on Developer Mode on the phone (Settings → Privacy & Security).
2. In Xcode → Settings → Accounts, sign in with your Apple ID. A free account works for your own device; the build expires after 7 days.
3. Run:
   ```sh
   cd app
   npx expo run:ios --device   # pick your iPhone from the list
   ```
   If Xcode asks for a signing team, open `app/ios/Lipidly.xcworkspace`, choose your team under Signing & Capabilities, and run again.
4. After the first install, `npx expo start` is enough for day-to-day changes.

## Trying it out

- **Sign in**: create an account with any email. The verification code is mocked: any 6 digits work. "Continue with Google" signs in as a local test account.
- **Sample data**: Profile → "Load sample data" (development builds only) fills the app with the design's sample user: two reports, an active plan, check-ins, two medicines and an appointment.
- **Adding a report**: any photo or PDF works. The mock returns sample values; the second report includes a deliberate misread (non-HDL 148) to show the consistency check.
- **Jump to a screen**: start Metro with `EXPO_PUBLIC_DEV_ROUTE=/plan npx expo start` (any route) to open that screen signed in with sample data. Add `EXPO_PUBLIC_DEV_SCENARIO=draft`, `proposal` or `escalation` for a report waiting to be confirmed, an updated plan to review, or a very high result. Development builds only.
- **Component gallery**: Profile → "Component gallery" (development only) shows every shared UI component.

## Structure

```
src/
  app/        routes (Expo Router); thin files that re-export feature screens
  features/   screens and feature-only components, by area
  ui/         design system: tokens, Text, Button, Card, chips, inputs, charts, mascot…
  state/      local store (zustand + AsyncStorage) and actions; the actions become AppSync calls later
  services/   mocked extraction, local notifications, support
  content/    marker explanations and articles (sample copy awaiting clinical review)
```

Brand assets (logo, app icon, splash, notification icon) live in `assets/brand`; see its README for usage rules. In code, use the `<Logo>` component from `@/ui`. `app.json` points at the icon and splash PNGs there. Changing them needs a native rebuild: `npx expo prebuild --clean`, then `npx expo run:ios`.

Business rules (status, focus, escalation, habits, plan updates) live in `packages/rules` and are shared with the future backend.

## Checks

```sh
npx tsc --noEmit
npx expo lint
npx expo-doctor
```
