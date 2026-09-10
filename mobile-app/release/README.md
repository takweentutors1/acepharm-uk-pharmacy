# Release folder

Manual QA builds and the test plan for AcePharm mobile. This is **not** the automated store
pipeline — see `../RELEASE.md` for Fastlane/TestFlight/Play Internal Testing.

## Contents

- `MANUAL_TESTING.md` — the pre-release manual QA test plan.
- `acepharm-v<version>-release.apk` — a release-mode Android build (optimized, tree-shaken) for
  sideloading onto test devices during manual QA.

## About the APK builds here

These are built with `flutter build apk --release` and are **debug-signed** — there's no
production Android keystore yet (see `../RELEASE.md` → "Android (Google Play Console)" for how to
generate one). Debug-signed builds:

- Install and run identically to a store build in every way that matters for manual QA
  (release-mode performance, no debug banner, minified/tree-shaken assets).
- **Cannot** be uploaded to Google Play — the Play Store rejects debug-signed uploads. Store
  submissions must go through the Fastlane `internal` lane once a real keystore and Play Console
  service account are set up.

To install on a connected device: `adb install acepharm-v<version>-release.apk`

## Building a new one

```
cd mobile-app
flutter build apk --release
cp build/app/outputs/flutter-apk/app-release.apk release/acepharm-v<version>-release.apk
```
