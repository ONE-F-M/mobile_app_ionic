# Backend API Inventory & Error-Logging Review

Companion to [error-message-audit.md](error-message-audit.md) — that report covers the *messages*,
this one covers the *calls* and the observability around them.

**Scope:** 11 modules in [src/api/](src/api/), 50 endpoint functions, 48 in use.

- [Section 1 — API Endpoints](#section-1--api-endpoints)
- [Section 2 — Audit](#section-2--audit)

---

# Section 1 — API Endpoints

Every HTTP call the app makes. All requests are built by
[`httpService._request`](src/api/http.service.ts#L30) as
`VITE_BASE_API_URL` + `VITE_API_PREFIX` + the endpoint below — currently
`http://192.168.0.163:81` + `/api/method/one_fm.api.` + endpoint.

**EH** rates error handling at the call site:

| Code | Meaning |
|---|---|
| **A** | Operation-specific message; distinguishes failure modes |
| **B** | Generic toast, no operation context — see [audit §1](error-message-audit.md) |
| **C** | Console-only; user sees nothing — see [audit §6](error-message-audit.md) |
| **D** | Broken; no message reaches the user at all |
| **—** | Unused |

| # | Module | Method | Endpoint | Function | Called from | EH |
|---|---|---|---|---|---|---|
| 1 | authentication | POST | `v1.authentication.user_login` | `userLogin` | [LoginPage.vue:65](src/views/authentication/LoginPage.vue#L65), [SetPasswordPage.vue](src/views/authentication/SetPasswordPage.vue) | **A** |
| 2 | authentication | POST | `v1.authentication.enrollment_status` | `getUserEnrollment` | [EmployeeId.vue:56](src/views/authentication/EmployeeId.vue#L56) | B |
| 3 | authentication | POST | `v1.utils.enrollment_status` | `getUserFaceEnrollment` | [CheckinGeolocation.vue:297](src/views/checkin/CheckinGeolocation.vue#L297), [store/user.js:168](src/store/user.js#L168) | B / C |
| 4 | authentication | POST | `v1.authentication.forgot_password` | `forgotPassword` | [VerificationMethodPage.vue:55](src/views/authentication/VerificationMethodPage.vue#L55), [VerifyOtpCodePage.vue:63](src/views/authentication/VerifyOtpCodePage.vue#L63) | B |
| 5 | authentication | POST | `v1.authentication.verify_otp` | `verifyOtp` | [VerifyOtpCodePage.vue:81](src/views/authentication/VerifyOtpCodePage.vue#L81) | B |
| 6 | authentication | POST | `v1.authentication.change_password` | `updatePassword` | [RegistrationPage.vue:63](src/views/authentication/RegistrationPage.vue#L63), [SetPasswordPage.vue:100](src/views/authentication/SetPasswordPage.vue#L100) | **D** / B |
| 7 | checkin | POST | `v1.face_recognition.get_site_location` | `getSiteLocation` | [CheckinGeolocation.vue:341](src/views/checkin/CheckinGeolocation.vue#L341), [CheckinListPage.vue:157](src/views/checkin/CheckinListPage.vue#L157), [store/user.js:169](src/store/user.js#L169) | **A** / C |
| 8 | checkin | POST | `v1.face_recognition.checkin_list` | `getCheckinList` | [CheckinListPage.vue:121](src/views/checkin/CheckinListPage.vue#L121), [store/user.js:86](src/store/user.js#L86) | **A** / C |
| 9 | checkin | POST | `v1.face_recognition.verify_checkin_checkout` | `verifyCheckin` | [CheckinGeolocation.vue:381](src/views/checkin/CheckinGeolocation.vue#L381) | **A** |
| 10 | configuration | GET | `v1.configuration.app_service` | `getServices` | [ServicePage.vue:81](src/views/user/ServicePage.vue#L81) | B |
| 11 | configuration | GET | `v1.configuration.app_service_group` | `getServicesGroups` | [ServicePage.vue:50](src/views/user/ServicePage.vue#L50) | B |
| 12 | configuration | GET | `v1.configuration.user_app_service` | `getUserServices` | [HomePage.vue:49](src/views/user/HomePage.vue#L49), [ServicePage.vue:90](src/views/user/ServicePage.vue#L90) | B |
| 13 | configuration | POST | `v1.configuration.update_create_user_app_service` | `updateServices` | [ServicePage.vue:114](src/views/user/ServicePage.vue#L114), [:135](src/views/user/ServicePage.vue#L135) | B |
| 14 | face_recognition | POST | `v1.face_recognition.enroll` | `enroll` | [EnrollmentStartPage.vue:14](src/views/enrollment/EnrollmentStartPage.vue#L14) | — |
| 15 | leave | POST | `v1.leave_application.leave_application_list` | `getLeavesList` | [LeavesListPage.vue:221](src/views/leaves/LeavesListPage.vue#L221), [store/user.js:119](src/store/user.js#L119) | B / C |
| 16 | leave | POST | `v1.leave_application.create_new_leave_application` | `createLeave` | [LeaveCreatePage.vue:292](src/views/leaves/LeaveCreatePage.vue#L292) | B |
| 17 | leave | GET | `v1.leave_application.get_leave_balance` | `balance` | [LeaveCreatePage.vue:132](src/views/leaves/LeaveCreatePage.vue#L132) | B |
| 18 | leave | GET | `v1.leave_application.get_leave_types` | `types` | [LeaveCreatePage.vue:78](src/views/leaves/LeaveCreatePage.vue#L78), [LeavesListPage.vue:97](src/views/leaves/LeavesListPage.vue#L97) | B |
| 19 | leave | GET | `v1.leave_application.get_leave_detail` | `details` | [LeaveDetailsPage.vue:111](src/views/leaves/LeaveDetailsPage.vue#L111) | B |
| 20 | leave | GET | `v1.leave_application.fetch_proof_document` | `profDocument` | [LeaveDetailsPage.vue:125](src/views/leaves/LeaveDetailsPage.vue#L125) | **C** |
| 21 | leave | POST | `v1.leave_application.leave_approver_action` | `updateLeaveStatus` | [LeaveDetailsPage.vue:143](src/views/leaves/LeaveDetailsPage.vue#L143), [:163](src/views/leaves/LeaveDetailsPage.vue#L163) | B |
| 22 | leave | POST | `v1.leave_application.get_employees_list` | `getEmployeesList` | [LeaveCreatePage.vue](src/views/leaves/LeaveCreatePage.vue) | B |
| 23 | leave | POST | `v1.leave_application.get_employees_role_to_display_reliever_field` | `getEmployee_reliever_permission` | [LeaveCreatePage.vue:94](src/views/leaves/LeaveCreatePage.vue#L94) | **D** |
| 24 | profile | GET | `api.get_user_details` | `getUserProfile` | [ProfilePage.vue:129](src/views/user/ProfilePage.vue#L129) | B |
| 25 | profile | GET | `v1.notification.get_notification_list` | `getNotifications` | [NotificationPage.vue:34](src/views/user/NotificationPage.vue#L34) | B |
| 26 | profile | POST | `v1.user.store_fcm_token` | `setDeviceIdNotifications` | [useNotification.js:17](src/composable/useNotification.js#L17), [services/notifications.js:55](src/services/notifications.js#L55) | **C** |
| 27 | profile | POST | `v1.api.push_notification_rest_api_for_checkin` | `pushNotification` | **unused** | — |
| 28 | profile | POST | `v1.user.change_user_profile_image` | `updateProfileImage` | [ProfilePage.vue:111](src/views/user/ProfilePage.vue#L111) | B |
| 29 | resignation | POST | `v1.resignation.create_resignation` | `createResignation` | [ResignationCreatePage.vue:310](src/views/resignation/ResignationCreatePage.vue#L310) | B |
| 30 | resignation | POST | `v1.resignation.withdraw_resignation` | `withdrawResignation` | [WithdrawalCreatePage.vue:197](src/views/resignation/WithdrawalCreatePage.vue#L197) | B |
| 31 | resignation | GET | `v1.resignation.get_supervisor_dropdown` | `getSupervisorDropdown` | **unused** | — |
| 32 | resignation | GET | `v1.resignation.get_employee_supervisor` | `getEmployeeSupervisor` | [ResignationCreatePage.vue:264](src/views/resignation/ResignationCreatePage.vue#L264), [ExtensionCreatePage.vue:195](src/views/resignation/ExtensionCreatePage.vue#L195), [WithdrawalCreatePage.vue:157](src/views/resignation/WithdrawalCreatePage.vue#L157) | **C** ×3 |
| 33 | resignation | GET | `v1.resignation.get_my_active_resignation` | `getMyActiveResignation` | [store/resignation.ts:25](src/store/resignation.ts#L25) | **C** |
| 34 | resignation | GET | `v1.resignation.get_all_my_resignations` | `getAllMyResignations` | [ResignationListPage.vue:123](src/views/resignation/ResignationListPage.vue#L123) | B |
| 35 | resignation | POST | `v1.resignation.extend_resignation` | `extendResignation` | [ExtensionCreatePage.vue:242](src/views/resignation/ExtensionCreatePage.vue#L242) | B |
| 36 | resignation | POST | `v1.resignation.correct_resignation_date_app` | `correctResignationDate` | [ResignationCorrectionPage.vue:179](src/views/resignation/ResignationCorrectionPage.vue#L179) | B |
| 37 | shifts | GET | `v1.shift_request.shift_request_list` | `getShiftsList` | [ShiftRequestListPage.vue:107](src/views/shifts/ShiftRequestListPage.vue#L107), [store/user.js:148](src/store/user.js#L148) | **A** / C |
| 38 | shifts | POST | `v1.shift_request.create_shift_request` | `createShift` | [ShiftRequestCreatePage.vue:104](src/views/shifts/ShiftRequestCreatePage.vue#L104) | **A** |
| 39 | shifts | GET | `v1.shift_request.get_shift_request_detail` | `details` | [ShiftRequestDetailsPage.vue:65](src/views/shifts/ShiftRequestDetailsPage.vue#L65) | **A** |
| 40 | shifts | POST | `v1.shift_request.shift_request_action` | `updateShiftStatus` | [ShiftRequestDetailsPage.vue:96](src/views/shifts/ShiftRequestDetailsPage.vue#L96), [:134](src/views/shifts/ShiftRequestDetailsPage.vue#L134) | **A** |
| 41 | stock_entry | POST | `v1.stock_entry.get_stock_entries` | `getStockEntries` | [store/stock_entry.js:40](src/store/stock_entry.js#L40) → [StockEntryListPage.vue:48](src/views/stock_entry/StockEntryListPage.vue#L48) | B |
| 42 | stock_entry | GET | `v1.stock_entry.get_stock_entry_detail` | `getStockEntryDetail` | [StockEntryDetailPage.vue:145](src/views/stock_entry/StockEntryDetailPage.vue#L145) | B |
| 43 | stock_entry | POST | `v1.stock_entry.get_warehouse_stock_balances` | `getWarehouseStockBalances` | [StockEntryCreatePage.vue:335](src/views/stock_entry/StockEntryCreatePage.vue#L335), [StockEntryDetailPage.vue:385](src/views/stock_entry/StockEntryDetailPage.vue#L385) | **C** ×2 |
| 44 | stock_entry | GET | `v1.stock_entry.get_stock_items` | `getStockItems` | [store/stock_entry.js:66](src/store/stock_entry.js#L66) | **C** |
| 45 | stock_entry | GET | `v1.stock_entry.get_warehouses` | `getWarehouses` | [store/stock_entry.js:94](src/store/stock_entry.js#L94) | **C** |
| 46 | stock_entry | GET | `v1.stock_entry.get_uoms` | `getUoms` | [store/stock_entry.js:106](src/store/stock_entry.js#L106) | **C** |
| 47 | stock_entry | POST | `/api/resource/Stock Entry` ⚠ | `createStockEntry` | [StockEntryCreatePage.vue:202](src/views/stock_entry/StockEntryCreatePage.vue#L202) | B |
| 48 | stock_entry | PUT | `/api/resource/Stock Entry/{name}` ⚠ | `updateStockEntry` | [StockEntryDetailPage.vue:192](src/views/stock_entry/StockEntryDetailPage.vue#L192) | B |
| 49 | stock_entry | POST | `/api/method/frappe.client.submit` ⚠ | `submitStockEntry` | [StockEntryDetailPage.vue:246](src/views/stock_entry/StockEntryDetailPage.vue#L246) | B |
| 50 | utils | GET | `v1.utils.google_map_api` | `getGoogleMapApiKey` | [CheckinGeolocation.vue:472](src/views/checkin/CheckinGeolocation.vue#L472) | **A** |

⚠ = malformed URL, see [§2.4.1](#41-three-stock-entry-write-endpoints-build-malformed-urls--high).

**Not listed:** [src/api/enrollment.ts](src/api/enrollment.ts) declares no endpoints — the file is
truncated mid-declaration and does not parse. See [§2.4.4](#44-dead-code--low).

### Endpoint counts

| Module | Endpoints | Unused |
|---|---|---|
| authentication | 6 | 0 |
| checkin | 3 | 0 |
| configuration | 4 | 0 |
| face_recognition | 1 | 0 |
| leave | 9 | 0 |
| profile | 5 | 1 |
| resignation | 8 | 1 |
| shifts | 4 | 0 |
| stock_entry | 9 | 0 |
| utils | 1 | 0 |
| enrollment | 0 (broken file) | — |
| **Total** | **50** | **2** |

### Error handling distribution

| Rating | Count | Share |
|---|---|---|
| **A** — operation-specific | 9 | 18% |
| **B** — generic toast | 27 | 54% |
| **C** — silent | 10 | 20% |
| **D** — broken | 2 | 4% |
| — unused / unrated | 2 | 4% |

Where an endpoint is rated differently at different call sites (e.g. `A / C` for a page handler
plus a silent prefetch), the table above counts its primary user-facing site.

---

# Section 2 — Audit

## 2.1 Transport layer

Everything funnels through [`httpService._request`](src/api/http.service.ts#L30) on top of
`CapacitorHttp`. There is no axios instance and no interceptor chain, despite `axios` being a
declared dependency in [package.json](package.json).

URLs are built unconditionally at [http.service.ts:61](src/api/http.service.ts#L61):

```js
url: `${BASE_URL}${API_PREFIX}${url}`
```

| Setting | Value |
|---|---|
| `BASE_URL` | `import.meta.env.VITE_BASE_API_URL` — currently `http://192.168.0.163:81` |
| `API_PREFIX` | `import.meta.env.VITE_API_PREFIX` — currently `/api/method/one_fm.api.` |
| Fallback prefix | `/api/method/one_fm.api.v1.` ← **does not match** (see [§2.4.2](#42-fallback-api_prefix-does-not-match-the-real-one--medium)) |
| Auth | `Authorization: <token>` from `useUserStore().token`, no scheme prefix |
| Default `Content-Type` | `application/x-www-form-urlencoded` (stripped for GET) |
| Timeout | **none configured** |
| Retry | **none** |
| Logging | **none** |

### What the layer does handle

**401 is handled centrally** at [http.service.ts:65-77](src/api/http.service.ts#L65-L77) — logout,
redirect to `/employee-id`, and it attaches a genuinely good message
(`"Your session has expired. Please log in again."`). This is the single best error path in the
codebase and the only one that writes for the user rather than the developer.

Two problems with it, though:

- It fires from **background prefetches** too ([store/user.js:86-205](src/store/user.js#L86-L205)). A stale token during a silent prefetch yanks the user out of whatever screen they are on, mid-task, with no warning.
- `window.location.href` is a full page reload, discarding all in-memory state, including unsaved form input.

**Everything ≥400 is rethrown raw** at [http.service.ts:79-81](src/api/http.service.ts#L79-L81).
The thrown value is the CapacitorHttp response object, so `.status` is always present — a fact
24 of 26 call sites fail to use (see [error-message-audit.md §5](error-message-audit.md)).

### What it does not handle

- **403** — no central handling. A permissions failure falls through to the generic toast.
- **Network / DNS / timeout** — `CapacitorHttp` rejects with a `TypeError`, which has no `.status` and no `.data`. This is the root cause of the identical-toast problem documented in [error-message-audit.md §1](error-message-audit.md).
- **Non-JSON responses** — a 502 HTML error page from a proxy lands as an unparsed body.

---

## 2.2 Per-module observations

**authentication** — `userLogin` is the only endpoint in the app that separates credential failure
from transport failure ([LoginPage.vue:106-113](src/views/authentication/LoginPage.vue#L106-L113)):
401/403 sets an inline "incorrect password" state, everything else gets a connection toast. **This
is the model the rest of the app should follow.** By contrast, `updatePassword` called from
`RegistrationPage` is rated **D** — the handler references an undefined variable and throws, so
account-creation failures are completely invisible ([audit §2](error-message-audit.md)).

**checkin** — the best per-site handling in the app: specific fallback titles, and GPS-vs-backend
discrimination at [CheckinListPage.vue:151](src/views/checkin/CheckinListPage.vue#L151). But the
messages are hardcoded English ([audit §7](error-message-audit.md)) and the map-init wrapper
swallows everything ([audit §6](error-message-audit.md)).

**configuration** — all five `ServicePage` handlers are byte-identical. A user who fails to add a
service and a user whose group list failed to load see the same toast.

**face_recognition** — `enroll` uploads a base64 video with **no size guard and no timeout**. On a
slow connection this hangs indefinitely with no user feedback and no way to cancel. The
highest-risk call in the app from a payload-size perspective.

**leave** — `getEmployee_reliever_permission` is rated **D**: its catch dereferences `error.data`
without optional chaining, so on a network failure the catch itself throws and no toast appears
([audit §9](error-message-audit.md)). Separately, `updateLeaveStatus` — an **approve/reject
action** — is the most consequential call in the module and gets the fully generic toast. An
approver cannot tell whether their approval was recorded.

**profile** — `getUserProfile` is the only endpoint not under the `v1.` namespace; it resolves to
`one_fm.api.api.get_user_details` rather than `one_fm.api.v1.*`. Worth confirming this is
deliberate and not a leftover from a pre-v1 API. `pushNotification` is dead code with a hardcoded
production employee ID (`HR-EMP-02756`) and a body of `"Test message from app"` — it should be
deleted, as it is a live path to push a test notification to a real employee's device.

**resignation** — `getEmployeeSupervisor` fails silently at all three call sites. The supervisor
field is left blank with no explanation on a legally significant form. If the user submits anyway,
the resignation may be filed against no supervisor.

**shifts** — the only module where **every** call site supplies an operation-specific fallback
title. Approve and reject are even distinguished from each other. The pattern to standardise on —
it just needs i18n.

**stock_entry** — `getWarehouseStockBalances` failing silently is a **data-integrity risk**: the
user proceeds to enter quantities validated against stale or absent stock balances
([StockEntryCreatePage.vue:179](src/views/stock_entry/StockEntryCreatePage.vue#L179) checks
"Quantity cannot exceed Current Quantity" against a number that may never have loaded). The three
write endpoints additionally build malformed URLs — see [§2.4.1](#41-three-stock-entry-write-endpoints-build-malformed-urls--high).

**utils** — `getGoogleMapApiKey` correctly collapses "request failed" and "200 with no key" into
one honest message ([CheckinGeolocation.vue:470-473](src/views/checkin/CheckinGeolocation.vue#L470-L473)).

---

## 2.3 Error-logging assessment

### 3.1 The API layer performs no logging whatsoever

All 11 modules are one-line passthroughs. There is no `try`/`catch`, no `console` statement, and
no instrumentation anywhere in [src/api/](src/api/).

Consequence: **when a user reports "I got Error!", there is nothing to investigate with.** No
record of which endpoint was called, what was sent, what came back, or when.

### 3.2 No correlation between client and server logs

No request ID, no trace header, no timestamp attached to outbound requests. A failure reported by a
user cannot be matched to the corresponding Frappe server log entry except by guessing from the
approximate time.

Adding a generated `X-Request-ID` header in `_request` and including it in the error toast (as a
small reference code) would make user reports actionable.

### 3.3 Logging is inconsistent and lives in the wrong layer

What logging exists sits in views and stores, in four different styles:

| Style | Example |
|---|---|
| `console.error(error)` — bare, no context | [ProfilePage.vue:110](src/views/user/ProfilePage.vue#L110), [LeaveCreatePage.vue:291](src/views/leaves/LeaveCreatePage.vue#L291), [NotificationPage.vue:33](src/views/user/NotificationPage.vue#L33), [EmployeeId.vue:57](src/views/authentication/EmployeeId.vue#L57) |
| `console.error("label:", error)` — labelled | [store/stock_entry.js:41](src/store/stock_entry.js#L41), [StockEntryDetailPage.vue:144](src/views/stock_entry/StockEntryDetailPage.vue#L144) |
| `console.warn(...)` — for deliberate degradation | [store/user.js:89](src/store/user.js#L89), [LoginPage.vue:53](src/views/authentication/LoginPage.vue#L53) |
| `console.log(...)` — leftover debugging | [VerifyOtpCodePage.vue:80](src/views/authentication/VerifyOtpCodePage.vue#L80), [EnrollmentPage.vue:88](src/views/enrollment/EnrollmentPage.vue#L88) |

The bare `console.error(error)` form is the most common and the least useful — in a production
console it produces an object with no indication of which operation produced it.

`console.log` in error paths should be removed or promoted;
[VerifyOtpCodePage.vue:80](src/views/authentication/VerifyOtpCodePage.vue#L80) logs `"error"` plus
the object on an OTP verification failure.

### 3.4 Nothing is reported off-device

No Sentry, no Crashlytics, no custom error endpoint — despite Firebase already being initialised
in [services/firebase.js](src/services/firebase.js) for push notifications. Production failures on
user devices are invisible to the team. Every quality signal is a user complaint.

Firebase Crashlytics would be the lowest-friction addition given the existing dependency.

### 3.5 Errors are logged twice or not at all, never consistently

Some sites log *and* toast ([ProfilePage.vue:110-111](src/views/user/ProfilePage.vue#L110-L111)),
some only toast ([ServicePage.vue:50](src/views/user/ServicePage.vue#L50)), some only log
([store/stock_entry.js:66](src/store/stock_entry.js#L66)). There is no rule. A centralised handler
should guarantee that every API failure is logged exactly once with its endpoint name, regardless
of whether it is shown.

### 3.6 No timeout means failures may never be logged at all

With no `connectTimeout`/`readTimeout` set, a request against an unreachable host can hang until
the OS gives up. The `catch` never runs, the `finally` never runs, so the loading flag stays
`true` and the spinner never stops. The user sees an indefinite spinner and **no error is logged
because no error was ever raised.** Most likely on `enroll` (base64 video) and
`updateProfileImage`.

---

## 2.4 Correctness defects

### 4.1 Three Stock Entry write endpoints build malformed URLs — **high**

[`_request`](src/api/http.service.ts#L61) unconditionally prepends `BASE_URL + API_PREFIX`. There
is no bypass. But three functions in [stock_entry.ts](src/api/stock_entry.ts) pass absolute Frappe
paths:

```js
http.put(`/api/resource/Stock Entry/${name}`, ...)   // updateStockEntry
http.post(`/api/resource/Stock Entry`, ...)          // createStockEntry
http.post(`/api/method/frappe.client.submit`, ...)   // submitStockEntry
```

Resulting URL for `updateStockEntry("SE-0001")`:

```
http://192.168.0.163:81/api/method/one_fm.api./api/resource/Stock Entry/SE-0001
```

The prefix is glued to an absolute path. Secondary defect: `name` is interpolated unencoded, and
the literal space in `Stock Entry` is not escaped either.

**This makes save, create, and submit fail on the Stock Entry screens** — and because those catch
blocks show `t("utils.save_error")` = `"Error saving"`
([audit §8](error-message-audit.md)), the user gets a textbook vague message for what is actually
a client-side URL bug. A concrete instance of vague messages hiding a real defect.

`httpService` needs to skip the prefix for URLs starting with `/`, or these three need to move to
proper `one_fm.api.v1.stock_entry.*` methods like their six siblings.

### 4.2 Fallback `API_PREFIX` does not match the real one — **medium**

| Source | Value |
|---|---|
| [http.service.ts:7](src/api/http.service.ts#L7) fallback | `/api/method/one_fm.api.v1.` |
| [.env](.env) actual | `/api/method/one_fm.api.` |
| [.env.example](.env.example) | `/api/method/one_fm.api.v1` |

All three differ. Since every endpoint string already begins with `v1.`, the fallback yields
`one_fm.api.v1.v1.authentication.user_login` — **every endpoint 404s** if `VITE_API_PREFIX` is
unset. And `.env.example` is wrong in two ways at once (extra `v1`, missing trailing dot), so a
new developer copying it gets a completely non-functional app with only generic error toasts to
diagnose it.

Fix `.env.example` to `/api/method/one_fm.api.` and make the fallback match.

### 4.3 POST calls sending `params` instead of `data` — **low**

[leave.ts:52](src/api/leave.ts#L52) and [leave.ts:62](src/api/leave.ts#L62):

```js
const updateLeaveStatus = async (params) => await http.post(`...leave_approver_action`, { params });
const getEmployee_reliever_permission = async (params) => await http.post(`...`, { params });
```

Every other POST in the codebase passes `data`. These two send the payload as a query string with
an empty body. May work if the Frappe handler reads `frappe.form_dict`, but it is inconsistent and
puts `employee_id` and `leave_id` into URLs (and therefore into server access logs).

### 4.4 Dead code — **low**

- [profile.ts:26-42](src/api/profile.ts#L26-L42) `pushNotification` — unused, hardcoded employee ID `HR-EMP-02756`, hardcoded test body. Delete.
- [resignation.ts:29](src/api/resignation.ts#L29) `getSupervisorDropdown` — unused. `getEmployeeSupervisor` superseded it.
- [enrollment.ts](src/api/enrollment.ts) — truncated at `const postEnroll` with no initialiser; **the file does not parse.** It is not imported anywhere (the `enrollment` imports in `src/locale/*/index.js` refer to a different file), so Vite never compiles it and the build passes — but `yarn lint` should be flagging it. Delete it; `face_recognition.ts` already provides the working `enroll`.
- [api/index.ts](src/api/index.ts) re-exports only 3 of the 11 modules; every consumer imports the module directly instead. Either complete it or remove it.

### 4.5 Type-safety escapes — **low**

`any` is used to silence the type checker at points where payload shape matters most:

- [shifts.ts:13](src/api/shifts.ts#L13), [:29](src/api/shifts.ts#L29) — `params as any`
- [stock_entry.ts:25](src/api/stock_entry.ts#L25) — `const params: any = {}`
- [stock_entry.ts:35](src/api/stock_entry.ts#L35), [:41](src/api/stock_entry.ts#L41), [:47](src/api/stock_entry.ts#L47) — `data: any` on all three write endpoints

The three untyped write endpoints are the same three with the malformed URLs (4.1) — no type-level
signal that they diverge from every other call in the codebase.

Also note [types/api.ts](src/types/api.ts): `LocationPayload` types `latitude`/`longitude` as
`string`, but [CheckinListPage.vue:134](src/views/checkin/CheckinListPage.vue#L134) obtains them
from `Geolocation.getCurrentPosition()`, which yields numbers.

---

## 2.5 Recommendations

Ordered by value-to-effort. The first two fix real breakage; the rest fix observability.

1. **Fix the Stock Entry URLs (4.1).** Save/create/submit are broken and the failure is disguised as "Error saving". Add an absolute-path bypass in `_request`, and `encodeURIComponent` the doc name.
2. **Correct `.env.example` and the fallback prefix (4.2).** One line each; prevents a whole class of confusing onboarding failures.
3. **Centralise error handling in `_request`.** It already owns 401. Extend it to classify: no-response/`TypeError` → offline; 403 → permissions; 4xx → validation; 5xx → server. Return a normalised `{ status, code, detail }` so the 28 duplicated call sites in [error-message-audit.md §1](error-message-audit.md) can collapse into one helper.
4. **Log every failure once, in the transport layer**, with endpoint name, HTTP status, and duration. Removes the four competing `console` styles and guarantees no failure goes unrecorded.
5. **Add `X-Request-ID`** and surface a short reference in error toasts, so user reports map to server logs.
6. **Set a default timeout** (e.g. 30s standard, longer for `enroll`/`updateProfileImage`) so hung requests raise a catchable error instead of an eternal spinner.
7. **Wire up Crashlytics** — Firebase is already initialised, so this is configuration rather than a new dependency.
8. **Delete the dead code in 4.4**, `pushNotification` first — it targets a real employee ID.
9. **Give the silent-failure endpoints a UI** — `getEmployeeSupervisor` (resignation forms) and `getWarehouseStockBalances` (stock validation) are the two where silence can produce a wrong submission rather than just a blank screen.
10. **Standardise on the `src/api/shifts.ts` call-site pattern** — every call passing an operation-specific fallback title, routed through i18n.
