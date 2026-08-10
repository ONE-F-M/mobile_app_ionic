# Error Message Audit

Survey of every user-facing and logged error path in `src/`. Written to explain *why* users
report the app's errors as generic and confusing, and to give each problem a concrete location.

Scope: 149 source files, 75 `catch` blocks, 165 error/log call sites.

Findings are ordered by user impact, not by file.

---

## Summary

| # | Problem | Sites | User impact |
|---|---------|-------|-------------|
| 1 | Network failures collapse to one identical toast on every screen | 28 | Critical |
| 2 | Registration failure shows nothing at all (undefined variable) | 1 | Critical |
| 3 | Registration server-rejection shows an empty body | 1 | High |
| 4 | Status-bucket fallbacks are developer text, not user text | 1 helper, all sites | High |
| 5 | Status code is read from a field the server may not send | 24 | High |
| 6 | Silent failures — logged to console, nothing shown to the user | 14 | High |
| 7 | Hardcoded English in error paths — Arabic users get English | 15 | Medium |
| 8 | Generic i18n keys reused for unrelated operations | 3 keys, 8 sites | Medium |
| 9 | Raw error fields concatenated into the toast | 1 | Medium |
| 10 | Four divergent error-extraction implementations | 4 | Medium (maintenance) |

---

## 1. Network failures collapse to one identical toast on every screen

**The dominant anti-pattern.** 28 call sites use this exact shape:

```js
showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
```

Found in [EmployeeId.vue:56](src/views/authentication/EmployeeId.vue#L56),
[SetPasswordPage.vue:100](src/views/authentication/SetPasswordPage.vue#L100),
[VerificationMethodPage.vue:55](src/views/authentication/VerificationMethodPage.vue#L55),
[VerifyOtpCodePage.vue:63](src/views/authentication/VerifyOtpCodePage.vue#L63) and
[:81](src/views/authentication/VerifyOtpCodePage.vue#L81),
[ProfilePage.vue:111](src/views/user/ProfilePage.vue#L111) and
[:145](src/views/user/ProfilePage.vue#L145),
[ServicePage.vue:50](src/views/user/ServicePage.vue#L50), [:81](src/views/user/ServicePage.vue#L81),
[:90](src/views/user/ServicePage.vue#L90), [:114](src/views/user/ServicePage.vue#L114),
[:135](src/views/user/ServicePage.vue#L135),
[NotificationPage.vue:34](src/views/user/NotificationPage.vue#L34),
[LeaveDetailsPage.vue:111](src/views/leaves/LeaveDetailsPage.vue#L111),
[:143](src/views/leaves/LeaveDetailsPage.vue#L143), [:163](src/views/leaves/LeaveDetailsPage.vue#L163),
[LeavesListPage.vue:97](src/views/leaves/LeavesListPage.vue#L97),
[:221](src/views/leaves/LeavesListPage.vue#L221),
[LeaveCreatePage.vue:78](src/views/leaves/LeaveCreatePage.vue#L78),
[:132](src/views/leaves/LeaveCreatePage.vue#L132), [:292](src/views/leaves/LeaveCreatePage.vue#L292),
[ResignationCreatePage.vue:310](src/views/resignation/ResignationCreatePage.vue#L310),
[ResignationListPage.vue:123](src/views/resignation/ResignationListPage.vue#L123),
[ResignationCorrectionPage.vue:179](src/views/resignation/ResignationCorrectionPage.vue#L179),
[ExtensionCreatePage.vue:242](src/views/resignation/ExtensionCreatePage.vue#L242),
[WithdrawalCreatePage.vue:197](src/views/resignation/WithdrawalCreatePage.vue#L197).

### Why it degrades to nothing

[`http.service.ts:58`](src/api/http.service.ts#L58) calls `CapacitorHttp[method](...)`. When the
device is offline, the DNS lookup fails, or the request times out, that call **rejects with a
`TypeError`, not with a response object**. A `TypeError` has no `.data`. So all three arguments
evaluate to `undefined`.

Trace it through [`toast.js:15`](src/composable/toast.js#L15):

- `error` (arg 2) is `undefined` → every branch at lines 17–23 is skipped → `errStr = null`
- `statusCode` (arg 3) is `undefined` → `getStatusMessage` returns `null` at line 82
- `message` (arg 1) is `undefined` → `errorTitle` falls back to `t("utils.toast.error")` = `"Error!"`
- the fallback at line 42 fires

**Every one of those 28 screens produces the identical toast:**

```
Error!
An unexpected error occurred. Please check your connection.
```

This is the single largest driver of the "errors are generic" complaint. Poor connectivity is the
most common real-world failure for a field workforce app, and it is the case that yields the
*least* information. The user cannot tell whether their leave request was submitted, whether their
resignation was filed, or whether the screen simply failed to load.

### A second, hidden defect in the same pattern

Argument 2 is `error?.data?.error`, never `error` itself. So the `error?.message` branch at
[toast.js:21](src/composable/toast.js#L21) is **dead code for all 28 sites** — the underlying
exception's own message is discarded before `showErrorToast` ever sees it. Even when the thrown
value carries a usable description, it is thrown away.

### The opposite failure mode

[HomePage.vue:49](src/views/user/HomePage.vue#L49) is the only site that passes the whole error:

```js
showErrorToast(error?.data?.message, error, error?.status || error?.data?.status_code);
```

This one *does* reach the `error?.message` branch — and surfaces raw runtime text such as
`TypeError: Load failed` or `Failed to fetch` directly to the user. Not vague, but not
comprehensible either. Note it is also the only site handling both status shapes (see finding 5).

---

## 2. Registration failure shows nothing at all

[RegistrationPage.vue:74-76](src/views/authentication/RegistrationPage.vue#L74-L76):

```js
.catch(async (err) => {
  await showErrorToast(error?.data?.message, error?.data?.error, error?.data?.status_code);
});
```

The catch parameter is `err`. The body references `error`, which **does not exist in this scope** —
the only other binding in the file is `inView` at line 34. This throws a `ReferenceError` inside an
`async` handler, producing an unhandled promise rejection.

**No toast is ever shown.** A user whose password-setup request fails at the network level taps the
button and sees nothing happen — no error, no navigation, no feedback of any kind. This is the worst
outcome in the codebase and it sits on the account-creation path.

Fix: rename to `err` (and see finding 10 for the shared helper this should call instead).

---

## 3. Registration server-rejection shows an empty body

[RegistrationPage.vue:67-69](src/views/authentication/RegistrationPage.vue#L67-L69):

```js
.then(async (res) => {
  if (res.error) {
    await showErrorToast(data.error);
    return;
  }
```

The condition tests `res.error` but the message reads `data.error`. `data` is the Pinia registration
store ([line 40](src/views/authentication/RegistrationPage.vue#L40)), which has no `error` field, so
this passes `undefined`. The server's actual rejection reason — sitting right there in `res.error` —
is discarded.

Result: header `"Error!"`, body `"An unexpected error occurred. Please check your connection."` — a
*connection* message for what is actually a server-side validation rejection (expired OTP, weak
password, etc.). Actively misleading.

Fix: `showErrorToast(res.error)`.

---

## 4. Status-bucket fallbacks are developer text, not user text

[`getStatusMessage` in toast.js:81-96](src/composable/toast.js#L81-L96) is the last line of defence
before the generic fallback, and every string it can return is unhelpful or wrong for an end user:

| Status | Current text | Problem |
|--------|-------------|---------|
| 1xx | `"Informational response received."` | Meaningless to a user; should never surface |
| 2xx | `"Success, but no detailed message provided."` | Shown inside a **red error toast** — contradictory |
| 3xx | `"Redirection detected. Additional action needed."` | What action? Unanswerable |
| 4xx | `"Client error occurred. Please check your request."` | The user made no "request" — they tapped a button |
| 5xx | `"Server error occurred. Please try again later."` | Acceptable, the only usable one |

The 2xx and 3xx branches are reachable: nothing constrains what callers pass as `statusCode`.

The 4xx bucket is the most damaging in practice. It covers the entire class of *actionable* errors —
validation failures, expired sessions, missing permissions, absent records — and flattens all of them
into "check your request", which tells the user nothing about what to change.

Recommendation: replace the buckets with per-status text written for the user, e.g.
- 400/422 → "Some of the information entered isn't valid. Please review and try again."
- 403 → "You don't have permission to do this."
- 404 → "We couldn't find that record. It may have been deleted."
- 408/timeout → "The server took too long to respond. Please try again."
- 5xx → keep.

Delete the 1xx/2xx/3xx branches; if they ever fire, that is a bug, and the generic fallback should
catch it.

---

## 5. Status code is read from a field the server may not send

[`http.service.ts:79-81`](src/api/http.service.ts#L79-L81) throws the CapacitorHttp **response
object**, which always carries a real `.status` property. But 24 of 26 sites read
`error?.data?.status_code` — a field in the Frappe response *body*, present only when the backend
chose to include it.

The two exceptions read the reliable field:
- [StockEntryListPage.vue:50](src/views/stock_entry/StockEntryListPage.vue#L50) — `error?.status`
- [HomePage.vue:49](src/views/user/HomePage.vue#L49) — `error?.status || error?.data?.status_code`

A third variant appears at [LoginPage.vue:106](src/views/authentication/LoginPage.vue#L106), which
checks all three shapes: `error.status || error.data?.status || error.response?.status`.

Consequence: on any HTTP error where the body omits `status_code`, `getStatusMessage` is handed
`undefined` and returns `null` — so even the weak 4xx/5xx text is skipped and the user drops through
to the fully generic fallback. The status information needed to say something useful **was
available** on the thrown object and was not read.

The shift pages ([ShiftRequestCreatePage.vue:106](src/views/shifts/ShiftRequestCreatePage.vue#L106),
[ShiftRequestDetailsPage.vue:67](src/views/shifts/ShiftRequestDetailsPage.vue#L67),
[:98](src/views/shifts/ShiftRequestDetailsPage.vue#L98),
[:136](src/views/shifts/ShiftRequestDetailsPage.vue#L136),
[ShiftRequestListPage.vue:109](src/views/shifts/ShiftRequestListPage.vue#L109)) use
`errorData.status_code` via a local `const errorData = error?.data || {}` — same defect, different
spelling.

---

## 6. Silent failures — logged to console, nothing shown to the user

These catches log and return. The user sees a spinner stop, an empty list, or a blank field, with no
indication that anything went wrong or that retrying might help.

**Blank map with no explanation** — the highest-impact case:
- [CheckinGeolocation.vue:560-561](src/views/checkin/CheckinGeolocation.vue#L560-L561) — `initializeMap` catch logs `"Map or Site Location Error"`. The check-in screen renders an empty map area indefinitely.
- [CheckinGeolocation.vue:581-582](src/views/checkin/CheckinGeolocation.vue#L581-L582) — same in `retryLocation`. The user taps "Try Again" from the permission modal, it fails, and nothing visibly changes — so they tap again.

**Fields silently left empty:**
- [ResignationCreatePage.vue:263-264](src/views/resignation/ResignationCreatePage.vue#L263-L264) — supervisor lookup fails, field stays blank, no explanation
- [ExtensionCreatePage.vue:194-195](src/views/resignation/ExtensionCreatePage.vue#L194-L195) — same
- [WithdrawalCreatePage.vue:156-157](src/views/resignation/WithdrawalCreatePage.vue#L156-L157) — same
- [LeaveDetailsPage.vue:125-126](src/views/leaves/LeaveDetailsPage.vue#L125-L126) — `fetchProfDocument` fails, attachment silently missing
- [StockEntryCreatePage.vue:335-336](src/views/stock_entry/StockEntryCreatePage.vue#L335-L336) — warehouse balance fails; user may enter a quantity against stale stock
- [StockEntryDetailPage.vue:385-386](src/views/stock_entry/StockEntryDetailPage.vue#L385-L386) — same

**Empty lists presented as "no data":**
- [store/stock_entry.js:66-67](src/store/stock_entry.js#L66-L67) — items
- [store/stock_entry.js:94-95](src/store/stock_entry.js#L94-L95) — warehouses
- [store/stock_entry.js:106-107](src/store/stock_entry.js#L106-L107) — UOMs
- [store/resignation.ts:25-27](src/store/resignation.ts#L25-L27) — stores the error on state but no view surfaces it

A failed fetch and a genuinely empty result are indistinguishable to the user. These should render a
retry affordance, not an empty state.

**Camera failure on the enrollment path:**
- [EnrollmentPage.vue:88](src/views/enrollment/EnrollmentPage.vue#L88) — `.catch((err) => console.log("media stream err:", err.name))` then `if (!stream) return;`. Face enrollment aborts with a blank screen. Denied camera permission and unavailable hardware are both swallowed here; the user is told neither.

**Acceptable as-is** (deliberate, documented, with a working retry path elsewhere):
- [store/user.js:86](src/store/user.js#L86), [:119](src/store/user.js#L119), [:148](src/store/user.js#L148), [:190](src/store/user.js#L190), [:203](src/store/user.js#L203) — prefetch optimisations; the comment at line 87 correctly notes the real page retries and owns the error UI
- [LoginPage.vue:52-53](src/views/authentication/LoginPage.vue#L52-L53) — background notification setup
- [main.js:81-87](src/main.js#L81-L87) — Firebase init, explicitly degrades
- [services/firebase.js:54](src/services/firebase.js#L54), [services/serviceWorker.js:17](src/services/serviceWorker.js#L17) and [:22](src/services/serviceWorker.js#L22), [services/notifications.js:55](src/services/notifications.js#L55), [useNotification.js:25](src/composable/useNotification.js#L25) — infrastructure, not user-initiated

---

## 7. Hardcoded English in error paths

These bypass i18n entirely. Arabic users (`src/locale/ar/`) see English error text, while the rest
of the screen is Arabic.

| Location | String |
|----------|--------|
| [useFileAttachment.ts:23](src/composable/useFileAttachment.ts#L23) | `"Invalid file type. Only PDF, JPG, and PNG files are allowed."` |
| [useFileAttachment.ts:29](src/composable/useFileAttachment.ts#L29) | `"File size exceeds 5MB limit."` |
| [LeaveCreatePage.vue:197](src/views/leaves/LeaveCreatePage.vue#L197) | `"Failed to upload a file"` |
| [LeaveCreatePage.vue:263](src/views/leaves/LeaveCreatePage.vue#L263) | `"You don't have enough leaves to apply"` |
| [LeaveDetailsPage.vue:96](src/views/leaves/LeaveDetailsPage.vue#L96) | `"No content available for download."` |
| [CheckinGeolocation.vue:297](src/views/checkin/CheckinGeolocation.vue#L297) | `"You have not enrolled your face. Please enroll."` |
| [CheckinGeolocation.vue:338](src/views/checkin/CheckinGeolocation.vue#L338) | `"Unable to retrieve site location"` |
| [CheckinGeolocation.vue:378](src/views/checkin/CheckinGeolocation.vue#L378) | `"Checkin failed"` |
| [CheckinListPage.vue:72](src/views/checkin/CheckinListPage.vue#L72) | `"An unexpected error occurred."` |
| [ShiftRequestDetailsPage.vue:110](src/views/shifts/ShiftRequestDetailsPage.vue#L110) | `"Reason cannot be blank. Please provide a specific reason."` |
| [ShiftRequestDetailsPage.vue:116](src/views/shifts/ShiftRequestDetailsPage.vue#L116) | `"Autogenerated reason detected! Please provide a more specific reason before approving."` |
| [ShiftRequestCreatePage.vue:104](src/views/shifts/ShiftRequestCreatePage.vue#L104) | `"Failed to create shift request"` |
| [ShiftRequestDetailsPage.vue:65](src/views/shifts/ShiftRequestDetailsPage.vue#L65) | `"Failed to fetch shift details"` |
| [ShiftRequestDetailsPage.vue:96](src/views/shifts/ShiftRequestDetailsPage.vue#L96) | `"Failed to reject shift request"` |
| [ShiftRequestDetailsPage.vue:134](src/views/shifts/ShiftRequestDetailsPage.vue#L134) | `"Failed to approve shift request"` |
| [ShiftRequestListPage.vue:107](src/views/shifts/ShiftRequestListPage.vue#L107) | `"Failed to fetch shift requests"` |
| [StockEntryCreatePage.vue:155](src/views/stock_entry/StockEntryCreatePage.vue#L155), [:159](src/views/stock_entry/StockEntryCreatePage.vue#L159), [:170](src/views/stock_entry/StockEntryCreatePage.vue#L170) | `"Please fill in all required fields"` |
| [StockEntryCreatePage.vue:164](src/views/stock_entry/StockEntryCreatePage.vue#L164) | `"Please add at least one item"` |
| [StockEntryCreatePage.vue:179](src/views/stock_entry/StockEntryCreatePage.vue#L179) | `"Quantity cannot exceed Current Quantity"` |
| [StockEntryCreatePage.vue:303](src/views/stock_entry/StockEntryCreatePage.vue#L303) | `"Please select Source Warehouse first"` |
| [LoginPage.vue:113](src/views/authentication/LoginPage.vue#L113) | `"Unable to connect to server. Please check your internet."` |
| [SetPasswordPage.vue:98](src/views/authentication/SetPasswordPage.vue#L98) | `"Password update successfully"` (also ungrammatical) |
| [toast.js:42](src/composable/toast.js#L42) | `"An unexpected error occurred. Please check your connection."` |
| [toast.js:84-93](src/composable/toast.js#L84-L93) | all five status-bucket strings |

Separately, `"Please fill in all required fields"` is itself vague — it fires at three different
[StockEntryCreatePage.vue](src/views/stock_entry/StockEntryCreatePage.vue#L155) validation points
without naming which field is missing. The form should highlight the offending field.

The shift pages are the best-behaved group in the repo: they always supply a specific operation title
(`"Failed to approve shift request"`) rather than letting the title default to `"Error!"`. That is the
pattern the other 28 sites should adopt — it just needs to go through i18n.

---

## 8. Generic i18n keys reused for unrelated operations

[`locale/en/utils.js`](src/locale/en/utils.js) defines three catch-all error strings that carry no
information about *what* failed or *why*:

| Key | English | Used at |
|-----|---------|---------|
| `error_fetching_data` | `"Error fetching data"` | [StockEntryListPage.vue:48](src/views/stock_entry/StockEntryListPage.vue#L48), [StockEntryCreatePage.vue:132](src/views/stock_entry/StockEntryCreatePage.vue#L132), [StockEntryDetailPage.vue:145](src/views/stock_entry/StockEntryDetailPage.vue#L145) |
| `save_error` | `"Error saving"` | [StockEntryCreatePage.vue:202](src/views/stock_entry/StockEntryCreatePage.vue#L202), [StockEntryDetailPage.vue:192](src/views/stock_entry/StockEntryDetailPage.vue#L192) |
| `submit_error` | `"Error submitting"` | [StockEntryDetailPage.vue:246](src/views/stock_entry/StockEntryDetailPage.vue#L246) |

"Error saving" does not say whether the entry was partially saved, whether the stock was reserved,
or whether retrying is safe — all things a warehouse user needs to know before acting. The server's
actual message is available in `error` at each of these sites and is discarded in favour of the
constant.

Also note [`utils.toast.error`](src/locale/en/utils.js#L3) = `"Error!"`, the default title for every
toast that doesn't supply one. Combined with finding 1, most error toasts in the app are titled
`"Error!"` and bodied with the generic connection string.

---

## 9. Raw error fields concatenated into the toast

[LeaveCreatePage.vue:94](src/views/leaves/LeaveCreatePage.vue#L94):

```js
showErrorToast(`${error.data.status_code} ${error.data.message} ${error.data.error}`);
```

Three problems:

1. Template-literal interpolation of possibly-absent fields renders the literal text `undefined`. When the body omits them, the user sees `"undefined undefined undefined"` or `"500 undefined undefined"`.
2. `error.data` is dereferenced without optional chaining — on a network failure this throws a `TypeError` inside the catch block, so **no toast appears at all** (same end state as finding 2).
3. Even in the happy path, prefixing a bare status number is developer-facing.

This is the only site in the repo using this shape; it should be brought in line with the others.

---

## 10. Four divergent error-extraction implementations

The same job is done four different ways, which is why fixing the message quality currently means
editing 28+ files:

1. **Inline triple-optional-chain** — 28 sites (finding 1). No page context, no fallback title.
2. **`errorData` destructure with an operation-specific fallback title** — 5 sites in `src/views/shifts/`. The best of the four; the title always says which operation failed.
3. **Local `getErrorMessage` helper** — [CheckinListPage.vue:62-73](src/views/checkin/CheckinListPage.vue#L62-L73). Prefers `data.error`, then `data.message`, then `"An unexpected error occurred."`. Correct logic, but private to one file and duplicating what `toast.js` already does internally.
4. **Raw concatenation** — [LeaveCreatePage.vue:94](src/views/leaves/LeaveCreatePage.vue#L94) (finding 9).

A fifth partial variant is the manual toast in
[LoginPage.vue:112-113](src/views/authentication/LoginPage.vue#L112-L113), which bypasses
`useCustomToast` entirely and builds a `toastController` toast by hand.

There is no shared normaliser. Every screen re-derives "what did the server actually tell me", and
each gets it slightly wrong in a different way.

---

## Recommended direction

Ordered by value-to-effort.

**Fix the two live bugs first** — findings 2, 3, and the unguarded dereference in 9. These are
one-line changes that convert "nothing happens" into "something happens", on the registration and
leave-application paths.

**Add a single error normaliser**, e.g. `src/composable/useApiError.ts`, that takes the thrown value
and returns `{ title, detail, status }`:
- reads `error.status` first, then `error.data?.status_code` (finding 5)
- detects the no-response / `TypeError` case explicitly and returns a real offline message, distinct from a server error (finding 1)
- prefers `error.data.error`, then `error.data.message`, then `error.message` — the logic already written correctly in [CheckinListPage.vue:62](src/views/checkin/CheckinListPage.vue#L62)

Then migrate the 28 sites to it. Each call becomes `showErrorToast(...useApiError(error, t('leaves.errors.submit_failed')))` — one operation-specific title per site, which is the missing ingredient in every generic toast today.

**Require an operation title at every call site.** The `message` parameter defaulting to `"Error!"`
is what makes the toasts interchangeable. Adopting the `src/views/shifts/` convention repo-wide
means the user always learns *which action* failed, even when the server says nothing useful.

**Rewrite `getStatusMessage`** per finding 4, and drop the 1xx/2xx/3xx branches.

**Give the silent failures a UI.** The two `CheckinGeolocation` map catches (finding 6) and the
`EnrollmentPage` camera catch are the highest-impact — all three currently leave the user staring at
a blank region on a screen they cannot proceed past. Failed list fetches should render a retry
control rather than an empty state.

**Move the 24 hardcoded strings into `src/locale/{en,ar}/`.** Best done as part of the migration
above, since each site needs a new operation-specific key anyway.
