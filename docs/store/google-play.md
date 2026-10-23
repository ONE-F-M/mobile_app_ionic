# Google Play: store listing, Data safety, content rating and App access

Answers to paste into Play Console (Store listing and App content). Keep this file in step with each release.

- Package: `com.onefacilitiesmanagement.android.app`
- Version: 7.0.0. CI sets the versionCode for each build (81 was the first upload to the Play internal track).
- Privacy policy URL: https://app.one-fm.com/privacy_policy/
- This repository is public. Do not put logins, passwords or keys in this file.

---

## 1. Listing

### App name

```
ONE FM
```

### Short description (80 characters or fewer)

English (68 characters):

```
ONE FM employee app: check-in, leave, resignation and notifications.
```

Arabic:

```
تطبيق موظفي ONE FM: الحضور والانصراف والإجازات والاستقالة والإشعارات
```

### Full description (4000 characters or fewer)

English:

```
ONE FM is the staff app for employees of ONE Facilities Management. It is for ONE FM employees only. Your employer creates your account, so you cannot sign up in the app.

What you can do:

• Log in with your employee ID and password.
• Check in and check out. The app confirms your identity with a short face check and records your location at the time.
• Request leave and follow the status of your leave requests.
• Submit and follow a resignation request.
• Receive notifications about your shift, requests and approvals.
• View and manage your profile.

The app is available in English and Arabic.

Your location is used only when you check in or out. The camera is used for the face check and to photograph documents you attach to a request. For details, read our privacy policy: https://app.one-fm.com/privacy_policy/

Questions about your account or your data: contact HR or info@one-fm.com.
```

Arabic:

```
تطبيق ONE FM هو تطبيق الموظفين في شركة ون لإدارة المرافق (ONE Facilities Management). التطبيق مخصص لموظفي ONE FM فقط. يتم إنشاء حسابك من قبل جهة عملك، ولذلك لا يمكنك التسجيل من داخل التطبيق.

ماذا يمكنك أن تفعل:

• تسجيل الدخول باستخدام رقم الموظف وكلمة المرور.
• تسجيل الحضور والانصراف. يتحقق التطبيق من هويتك عبر فحص قصير للوجه ويسجّل موقعك في تلك اللحظة.
• تقديم طلبات الإجازة ومتابعة حالتها.
• تقديم طلب استقالة ومتابعته.
• استلام إشعارات حول المناوبة والطلبات والموافقات.
• عرض ملفك الشخصي وإدارته.

التطبيق متوفر باللغتين العربية والإنجليزية.

يُستخدم موقعك فقط عند تسجيل الحضور أو الانصراف. تُستخدم الكاميرا لفحص الوجه ولتصوير المستندات التي ترفقها بالطلبات. لمزيد من التفاصيل، يرجى قراءة سياسة الخصوصية: https://app.one-fm.com/privacy_policy/

للاستفسار عن حسابك أو بياناتك، تواصل مع الموارد البشرية أو راسل info@one-fm.com.
```

---

## 2. Data safety

### Data collection and security

| Question | Answer |
| --- | --- |
| Does the app collect or share any of the required user data types? | Yes |
| Is all of the user data collected by the app encrypted in transit? | Yes |
| Do you provide a way for users to request that their data is deleted? | Yes |
| Deletion request URL / contact | HR, or info@one-fm.com |
| Is data shared with third parties? | No. Firebase and Sentry act as service providers (processors) for ONE FM, so their handling is not "sharing". |

### Data types

| Category | Data type | Collected | Shared | Required or optional | Purposes |
| --- | --- | --- | --- | --- | --- |
| Location | Precise location | Yes | No | Required | App functionality |
| Location | Approximate location | Yes | No | Required | App functionality |
| Photos and videos | Photos, Videos (face video at check-in and enrolment; document photos) | Yes | No | Required for check-in; document photos only when attached | App functionality |
| Personal info | User IDs (employee ID) | Yes | No | Required | App functionality, Account management |
| Device or other IDs | Device or other IDs (push token, anonymous app install ID) | Yes | No | Required | App functionality |
| App info and performance | Crash logs, Diagnostics (Sentry) | Yes | No | Required | App functionality, Analytics |
| App activity | App interactions | Yes, **only while Firebase Analytics is in the Android build** (see below) | No | Required | Analytics |

### Analytics SDK

- While `firebase-analytics` is still in `android/app/build.gradle`, declare **App activity > App interactions** for **Analytics**.
- Once Firebase Analytics is removed from the Android build, remove that row and declare no analytics SDK. Crash logs and Diagnostics (Sentry) stay declared for App functionality and Analytics.

### Account deletion

There is no in-app account deletion. Accounts are created by the employer, and check-in records are kept for audit. Users ask for deletion through HR or info@one-fm.com. In the Play Console account deletion question, answer that the app does not let users create an account, and give the contact above.

---

## 3. Content rating, target audience and other declarations

| Item | Answer |
| --- | --- |
| Category (questionnaire) | Utility, productivity, communication or other (not a game, not social) |
| Violence, sexual content, profanity, controlled substances, gambling | No to all |
| User-generated content, user-to-user chat or sharing of location with other users | No |
| Digital purchases | No |
| Expected content rating | Everyone |
| Target audience | 18 and over |
| Appeals to children | No |
| Ads | No |
| News app | No |
| Government app | No |
| Financial features | None |

---

## 4. App access

Select: **All or some functionality is restricted** (login is required).

Paste into Play Console:

```
Login is required. The app is for ONE FM employees only.

1. Open the app. The login screen is shown first.
2. Enter the Employee ID in the "Employee ID" field.
3. Enter the password in the "Password" field and tap Login.

Employee ID: see Play Console
Password: see Play Console

Check-in and check-out are open daily between 21:15 and 14:59 UTC. Outside this window the check-in action is not available. Please test check-in inside this window. Check-in asks for camera and location permission.
```

Do not write the reviewer login in this file. Enter it in Play Console only (the login comes from WI-003898).

---

## 5. Screenshot checklist

Requirements for every language: phone, 1080x2400, 4 to 8 screenshots.

Take the screenshots from the production build on a Pixel-size emulator. Use a test account with made-up data. **No real employee data** (names, IDs, photos, locations, leave details).

Screenshots to take (English set, then repeat the full set in Arabic with the app in RTL):

| Done | Screen | English | Arabic |
| --- | --- | --- | --- |
| [ ] | Login | [ ] | [ ] |
| [ ] | Home | [ ] | [ ] |
| [ ] | Check-in map | [ ] | [ ] |
| [ ] | Check-in success | [ ] | [ ] |
| [ ] | Leave list | [ ] | [ ] |
| [ ] | Profile | [ ] | [ ] |

Other store assets (not in this file): 512x512 icon, 1024x500 feature graphic.

---

## Checked against

Files read on staging: `android/app/src/main/AndroidManifest.xml`, `android/app/build.gradle`, `package.json`. Nothing else in the app was read for this document.

### Permissions (`AndroidManifest.xml`)

Declared:

- `CAMERA`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`
- `READ_EXTERNAL_STORAGE` (maxSdkVersion 32)
- `WRITE_EXTERNAL_STORAGE` (maxSdkVersion 32)
- `POST_NOTIFICATIONS`
- `INTERNET`

Removed on purpose (`tools:node="remove"`): `AD_ID`, `ACCESS_ADSERVICES_AD_ID`, `ACCESS_ADSERVICES_ATTRIBUTION` and the install referrer permission. This agrees with "Ads: No".

Optional hardware (`required="false"`): camera, camera autofocus, GPS.

Not declared: `RECORD_AUDIO`. Face video is declared as video; the manifest does not show the app recording sound.

### SDKs and libraries

From `package.json`:

- Capacitor 8.5.2 core, with plugins: camera, geolocation, push-notifications, device, filesystem, file-opener, preferences, network, app, haptics, keyboard, splash-screen
- `@sentry/capacitor` 4.3.0 and `@sentry/vue` 10.69.0 (crash logs and diagnostics)
- `firebase` ^11.0.2 (web SDK)
- Ionic Vue 7, Vue 3, Pinia, vue-i18n, axios, dayjs

From `android/app/build.gradle`:

- Firebase BoM 32.8.1 with `com.google.firebase:firebase-analytics`
- Sentry Android Gradle plugin `io.sentry.android.gradle` (org `one-fm`, host `https://de.sentry.io/`)
- Google services plugin applied only when `google-services.json` is present (needed for push)
- Release build: minify and shrink enabled; `allowBackup` is false in the manifest

### Where the brief and the code differ, or cannot be confirmed from these three files

1. **Firebase Analytics is still in the app.** `firebase-analytics` is in `build.gradle`, so the "App interactions for analytics" row stays until it is removed. The brief already allows for this.
2. **Approximate location.** The manifest declares both `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION`. The brief lists only precise location. Declaring precise location is consistent with the manifest, but whoever pastes this should decide whether to also tick Approximate location in Play Console.
3. **Storage permissions.** `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` (up to Android 12L) are in the manifest but not mentioned in the brief. They fit the document photo and file download features. No separate Data safety row is needed for them, but they should be checked if Play shows a permissions warning.
4. **Push token.** `@capacitor/push-notifications` is in `package.json` and the manifest sets a Firebase Messaging notification icon. There is no explicit `firebase-messaging` line in `build.gradle`, so the push library comes in through the Capacitor plugin. This agrees with the brief's push token claim, but it was not checked at library level.
5. **Anonymous app install ID.** `@capacitor/device` and Firebase Analytics are present and can supply an install or device identifier. Which one the app sends to the backend was not checked.
6. **Not verifiable from the three files.** These claims come from the brief and were not checked against screens or API code: resignation feature, the face check at check-in and enrolment, the check-in window of 21:15 to 14:59 UTC, encryption in transit (HTTPS host comes from environment settings), and the privacy policy text. Compare them with the privacy policy before publishing.
