# Lipidly

Lipidly is a mobile app for adults with high cholesterol or triglycerides. You add a lab report, check the values it reads, and get a small plan: one marker to focus on, two or three daily habits that fit your life, and a retest date. A one-minute daily check-in tracks the habits. When the next report arrives, the plan updates. The app also reminds you about medicines and appointments, and tells you to see your doctor when a result is beyond what habits should handle.

It supports your doctor's plan. It doesn't diagnose or give medical advice.

## Where things stand

- **Mobile app** (React Native + Expo): every first-release screen is built. It runs fully on the phone with **mocked** sign-in and report reading, and data stays on the device.
- **Rule engine** (TypeScript): decides results, focus marker, habits, plan updates and "see your doctor". It's finished, and the thresholds are drafts awaiting clinical review.
- **Backend** (AWS CDK): an empty placeholder. The planned stack is Cognito, AppSync, Lambda, DynamoDB, S3 and Bedrock.

## Repo layout

```
app/              Expo app (iOS and Android)
  src/app/        routes (Expo Router)
  src/features/   screens, grouped by area: home, plan, reports, medicines, profile…
  src/ui/         shared design system: tokens, buttons, cards, chips, charts, mascot
  src/state/      local store and actions (these become backend calls later)
  src/services/   mocked report reading, local notifications
packages/rules/   rule engine shared by the app and the future backend
backend/          AWS CDK project (no resources yet)
```

## Getting started

You need Node 22, npm, and Xcode (for iOS). Android Studio works too, but it hasn't been tried yet.

```sh
git clone git@github.com:sidathasiri/lipidly.git
cd lipidly
npm install          # installs every workspace
```

Run the app in the iOS Simulator:

```sh
cd app
npx expo run:ios     # first build takes a few minutes, then starts Metro
```

The app uses native modules (camera, notifications, date picker), so it runs as a development build, not in Expo Go. To install it on your own iPhone, see [app/README.md](app/README.md).

## Trying it out

- **Sign up** with any email. Any 6-digit code works, because sign-in is mocked. "Continue with Google" signs in as a local test account.
- **Add a report** with any photo or PDF. The mock returns sample values, and the second report includes a deliberate misread to show how the app asks you to check it.
- **Skip onboarding:** Profile → "Load sample data" fills the app with a sample user who has two reports, an active plan, check-ins and medicines.
- **Jump to a screen:** `EXPO_PUBLIC_DEV_ROUTE=/plan npx expo start` opens that screen with sample data.

## Working on it

```sh
cd app
npx tsc --noEmit     # typecheck
npx expo lint        # lint
npx expo-doctor      # dependency check
```

A few conventions keep the UI consistent:

- Screens are built from components in `app/src/ui`; they don't set their own colours, sizes or fonts.
- All text uses `<Text variant="…">`.
- Lab-result colours (green, amber, red) appear only through `StatusChip`, `RangeGauge` and `TrendChart`.
- Health decisions (statuses, focus marker, habits, escalation) belong in `packages/rules`, not in screens.

## What's next

- Connect the backend: Cognito sign-in, AppSync, DynamoDB, and report reading with Bedrock.
- Before App Store release: add Sign in with Apple, account linking, and SES for emails.
- Clinical review of the rule thresholds, habit library and explanation text.
