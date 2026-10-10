# Lipidly brand assets: two-tone heart (logo 3d)

Two overlapping halves of one heart: one is your habits, the other your doctor's plan. All SVGs are pure vector paths, and the wordmark text is already converted to outlines, so no font is needed.

## Colours
| Part | Hex |
|---|---|
| Left half | `#0E7490` (primary) |
| Right half | `#22D3EE` |
| Overlap | `#026086` |
| Wordmark | `#0F172A` |
| Icon background | `#ECFEFF` |
| White version (on teal) | left `#FFFFFF`, right `#A5F3FC`, wordmark `#FFFFFF` |

Never recolour the heart red, green or amber. Those colours are reserved for lab-result status.

## Files
**svg/**: use these in the app via react-native-svg or flutter_svg.
- `logo-mark.svg`: colour heart.
- `logo-mark-white.svg`: for teal or dark backgrounds.
- `logo-mark-mono.svg`: single colour (teal).
- `lockup.svg`, `lockup-white.svg`: heart + "lipidly", horizontal. Use on splash, sign-in and About.
- `wordmark.svg`, `wordmark-white.svg`: the name on its own.
- `app-icon.svg`: 1024 master for the icon.

**png/**
- `app-icon-ios-1024.png`: App Store / Xcode asset. It's square with no transparency; iOS applies the rounded mask.
- `app-icon-playstore-512.png`: Google Play listing.
- Android adaptive icon (`mipmap-anydpi-v26/ic_launcher.xml`):
  - `android-adaptive-foreground-432.png`: transparent; the heart sits inside the 66dp safe zone.
  - `android-adaptive-background-432.png`: solid `#ECFEFF`. You can use a colour resource instead.
  - `android-adaptive-monochrome-432.png`: for Android 13+ themed icons.
- `android-notification-96.png`: white silhouette for the status bar (xxxhdpi, 24dp). Android requires white-on-transparent.
- `logo-mark-1024.png`, `logo-mark-white-1024.png`: transparent high-res mark. Use it for the splash screen (expo-splash-screen / flutter_native_splash) on `#ECFEFF` or `#0E7490`.
- `lockup.png`, `lockup-2x.png`, `lockup-3x.png` (and the `-white` versions): bitmap fallbacks at 1x/2x/3x (196×55 pt).

To generate every icon density from the masters, use `npx expo prebuild` / app.json `icon` + `adaptiveIcon`, `flutter_launcher_icons`, or Android Studio's Image Asset tool with the foreground PNG and background colour above.

## Usage
- Clear space: at least half the heart's width on every side.
- Minimum size: mark 16 px; lockup 80 px wide.
- On photos or busy backgrounds, place the white version on a solid `#0E7490` panel.
- Don't stretch, rotate, outline, add shadows, or swap the two halves.
- Wordmark font: Bricolage Grotesque ExtraBold (800), optical size 48, tracking −3.5%. It's already outlined in the SVGs.
