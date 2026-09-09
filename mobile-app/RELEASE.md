# Release Pipeline — TestFlight & Play Internal Testing

Fastlane automation lives in `android/fastlane/` and `ios/fastlane/`. The
GitHub Actions workflow at `.github/workflows/mobile-release.yml` runs both
(`Actions` tab → **Mobile - Fastlane Release** → **Run workflow**). This
automation can't run until the one-time manual setup below is done — Apple
and Google both require a human to create the app listing and accept
agreements first.

## One-time manual setup

### Android (Google Play Console)

1. Create the app in [Play Console](https://play.google.com/console) with
   package name `com.acepharm.app`, and complete the initial store listing
   + content rating + data safety questionnaire (Play Console won't accept
   API uploads until these exist).
2. Upload one release manually (Internal Testing track) via the console —
   the Play Developer API rejects the very first upload of a new app.
3. Generate a release keystore if you don't have one:
   ```
   keytool -genkey -v -keystore release.keystore -alias acepharm \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
4. Create a service account for API access: Play Console → **Setup** →
   **API access** → create a service account in the linked Google Cloud
   project, grant it **Release manager** permission, download its JSON key.
5. Add these GitHub Actions repo secrets:
   - `ANDROID_KEYSTORE_BASE64` — `base64 -i release.keystore | pbcopy`
   - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`
   - `PLAY_STORE_JSON_KEY` — the full contents of the service account JSON file

### iOS (App Store Connect / TestFlight)

1. Register the app in [App Store Connect](https://appstoreconnect.apple.com)
   with bundle ID `com.acepharm.app` (create the matching identifier under
   **Certificates, Identifiers & Profiles** first if it doesn't exist).
2. In Xcode, open `ios/Runner.xcworkspace`, select the Runner target →
   **Signing & Capabilities**, and set your Team — this only needs to
   happen once, locally, so Xcode's project file records a valid team.
3. Create an App Store Connect API key: **Users and Access** → **Keys** →
   generate one with the **App Manager** role. Note the Key ID, Issuer ID,
   and download the `.p8` file (Apple only lets you download it once).
4. Add these GitHub Actions repo secrets:
   - `ASC_KEY_ID`, `ASC_ISSUER_ID`
   - `ASC_KEY_CONTENT` — `base64 -i AuthKey_XXXX.p8 | pbcopy`
   - `APPLE_TEAM_ID` (Developer Portal team ID) and `APPLE_ITC_TEAM_ID`
     (App Store Connect team ID — same as `APPLE_TEAM_ID` unless you belong
     to more than one team)

No certificates or provisioning profiles need to be generated or stored
manually — the `beta` lane fetches/refreshes a distribution certificate and
an App Store provisioning profile on every run using the API key alone.

## Running a release

- **Both platforms**: Actions → Mobile - Fastlane Release → Run workflow → `platform: both`
- **One platform**: same, with `platform: android` or `platform: ios`

Every run uploads a **new build** to Internal Testing / TestFlight — it
never auto-promotes to production or public beta. Promoting a build to a
wider audience is a separate, deliberate step in each store's console.

## Running a lane locally

```
cd mobile-app/android && bundle install && bundle exec fastlane build   # signing smoke test, no upload
cd mobile-app/ios && bundle install && bundle exec fastlane beta        # requires local Xcode signing (see step 2 above)
```
