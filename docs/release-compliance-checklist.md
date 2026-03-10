## Kippo Release Compliance Checklist

Audit date: March 10, 2026

### What is already in the repo

- Expo SDK 54 / React Native 0.81 app configuration is present in [app.config.js](/Users/dicksonkerobean/Dev/MobileApps/PersonalFinanceApp2/app.config.js).
- iOS privacy manifest exists at [ios/Kippo/PrivacyInfo.xcprivacy](/Users/dicksonkerobean/Dev/MobileApps/PersonalFinanceApp2/ios/Kippo/PrivacyInfo.xcprivacy).
- In-app account deletion UI exists at [app/(app)/settings/account.tsx](/Users/dicksonkerobean/Dev/MobileApps/PersonalFinanceApp2/app/(app)/settings/account.tsx).
- `expo export` succeeded for both iOS and Android on March 10, 2026, so the Metro bundle currently builds.

### Release blockers still open

- Do not ship until all client-side secrets are removed and rotated. The app previously exposed backend credentials through public Expo config and local env usage.
- `npx expo-doctor` warns that this repo has native folders plus app config fields. Per Expo docs, config fields are not automatically synced when native folders are committed; rerun `npx expo prebuild` before release or manually keep native projects aligned.
- `npm run type-check` fails with many app and test errors. Bundling works, but the codebase is not in a clean release state.
- `npm test -- --runInBand` fails due broken mocks, missing test dependencies, and outdated API contracts.
- `npm run lint` fails with real errors plus a large warning backlog.

### Apple App Store submission tasks

- Add a public privacy policy URL in App Store Connect.
- Complete App Privacy details for the app and third-party SDKs. Based on current code, review disclosures for:
  - Contact info
  - User identifiers
  - Financial information and transaction history
  - Push notification identifiers
  - Diagnostics and crash/log data if you keep remote logging
- Verify the final archived app contains up-to-date privacy manifests for Expo, OneSignal, Clerk, and any other shipped SDKs.
- Keep the in-app delete-account flow working in production and ensure all user data deletion behavior matches the description shown to reviewers.

Official sources:
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple privacy manifests: https://developer.apple.com/documentation/bundleresources/privacy_manifest_files
- Apple app privacy details: https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-app-privacy-details
- Apple account deletion guidance: https://developer.apple.com/support/offering-account-deletion-in-your-app/

### Google Play submission tasks

- Complete the Data safety form in Play Console using the real production data flows.
- Provide both in-app account deletion and a web URL for account deletion if the app offers account creation.
- Publish a privacy policy URL that matches the app's actual data handling.
- Complete the Financial features declaration if the production app offers financial products, account aggregation, budgeting, or related finance functionality.
- Confirm the final Android App Bundle targets the current Play requirement before submission.

Official sources:
- Target API level requirements: https://support.google.com/googleplay/android-developer/answer/11926878
- Data safety form: https://support.google.com/googleplay/android-developer/answer/10787469
- Account deletion requirements: https://support.google.com/googleplay/android-developer/answer/13327111
- Personal and Sensitive Information policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Financial features declaration: https://support.google.com/googleplay/android-developer/answer/12154973

### Recommended release sequence

1. Rotate any exposed secrets and move every server credential to backend-only storage.
2. Fix the red `type-check`, `lint`, and `test` results.
3. Re-run `npx expo prebuild` so committed native files match [app.config.js](/Users/dicksonkerobean/Dev/MobileApps/PersonalFinanceApp2/app.config.js).
4. Build a signed release with EAS, then verify the final metadata in App Store Connect and Play Console.
