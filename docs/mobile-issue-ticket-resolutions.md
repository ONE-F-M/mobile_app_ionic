# Mobile-Issue Open Tickets — Resolution Notes (draft, not posted)

Generated from live read-only analysis on 2026-08-02. **Nothing here has been posted to
one-fm.com** — paste each block into the corresponding HD Ticket yourself.

## When to close each ticket (action summary)

Three groups. Nothing closes automatically — all are manual status changes.

| Close timing | Tickets | Why |
|---|---|---|
| **CLOSE NOW** (stale — data already clean) | 19121, 19122, 19123, 19142 | Attendance data contradicts the complaint; not reproducing |
| **CLOSE ON DEPLOY** (fix directly resolves) | 19147, 19145, 19129, 19120 | Resolved by the code changes once shipped |
| **CONFIRM THEN CLOSE** (device/site-specific) | 19140, 19171, 19112 | Fix helps, but verify the employee's real check-ins normalize for ~1 day first |

"Deploy" = `bench migrate` + restart on one-fm.com **and** rebuild/release the mobile app.
Each ticket below is tagged with its **Closeable:** timing. Fix references: **A** = OAuth refresh
token, **B** = app GPS handling, **C** = site-name display (see root-cause legend).

Verification method for each: pulled the employee's Shift Assignment, `site_location` →
`Location.geofence_radius`, and Employee Checkin history via read-only API, and compared the
actual attendance record against the complaint.

Root-cause legend:
- **A – OAuth session expiry:** `user_login` issues a ~1 hr OAuth2 access token; the app never
  stores/uses the returned `refresh_token`, so the first check-in after expiry 401s and the app
  force-logs-out. (`api/v1/authentication.py:562-585`, `store/user.js`, `http.service.ts:64-77`)
- **B – App GPS handling:** check-in GPS calls have no/short timeout, no retry, no accuracy
  tolerance, and the check-in button is hidden behind a blocking "Locating…" state.
  (`CheckinGeolocation.vue:202-204`, `CheckinListPage.vue:134-137,288-307`)
- **C – Site resolution/labelling:** displayed site name comes from `Operations Shift.site`,
  decoupled from the resolved geofence Location; Shift-Request site changes only apply once
  `status=Approved` / the morning cron runs. (`api/v1/face_recognition.py:326,344,508-516`)
- **D – Time-window gate (by design):** the check-in button only appears inside
  `[shift start − grace, shift end + grace]`. Looking before the window = no button.

Verified fact for the whole batch: **geofence radii are generous (250–500 m) and site
mappings are correct and uniform** (e.g. all 7 KITC staff share `360 Tennis Parking`, matching
the `Operations Site`). No geofence/roster/data changes are warranted.

---

## 19171 — 2508008IN100, Muhammed Sidhiqu Sulaiman — "Check in Issues for 28.07.2026"
**Status: KEEP OPEN — real issue, but it is check-OUT, not check-in.**
**Closeable: CONFIRM THEN CLOSE** — after deploy, verify his end-of-shift OUTs start recording.

Finding: Shift Assignment present every day (Day 06:30–18:30, Al Kout Mall Car Park, geofence
Al-kout Fahaheel, radius 300 m). Employee checks *in* reliably (06:24–07:27), but the check-*out*
is missing almost every day; the only clean OUT in the window is 28-07 at a round `18:30:00`,
which is a manual/auto HR correction — i.e. the ticket date was fixed by hand, not by the app.

Root cause: **B** — GPS/check-out flow fails at end of shift (18:30), so OUT is not recorded.
Not a roster or geofence problem (radius is 300 m; check-in succeeds daily).

Resolution note to post:
> Investigated. Shift assignment and site geofence (Al-kout Fahaheel, 300 m) are correct, and
> your morning check-ins are recording fine. The actual problem is the **check-out** at 18:30
> not being captured — this is the app's location handling at end of shift, which we are fixing
> in the mobile app (adding a GPS timeout/retry and accuracy tolerance so check-out completes
> reliably). 28-07 was corrected manually. Keeping this open against the app fix.

---

## 19140 — 2501031GH194, Ebenezer Kojo Mensah — "Check in issues"
**Status: KEEP OPEN — genuine chronic GPS/device issue.**
**Closeable: CONFIRM THEN CLOSE** — after deploy, verify his daily check-ins stop running 1–3 hrs late.

Finding: Shift Assignment present daily (Day 06:00–18:00, 360 Food Hall, radius 250 m). Check-in
is 1–3.5 hours late *every day* (06:51, 07:05, 07:20, 07:49, 08:59, 09:27) and OUT is frequently
missing. The two exact `06:00:00 / 18:00:00` entries are manual corrections, not app check-ins.

Root cause: **B/E** — chronic failure to obtain a usable GPS fix at an indoor mall/food-hall
location, amplified by the app's untimed, retry-less, button-blocking GPS handling. Geofence is
fine (250 m; colleagues at 360 Food Hall check in on time).

Resolution note to post:
> Investigated. Your shift assignment and the 360 Food Hall geofence (250 m) are correct. The
> repeated 1–3 hr delays are the app failing to get a GPS fix at this indoor location. We are
> fixing the mobile app's location handling (timeout + automatic retry + accuracy tolerance, and
> removing the block that hides the check-in button while "Locating"). Interim workaround: step
> just outside/near an entrance with clear sky view when checking in. Keeping this open against
> the app fix.

---

## 19112 — 2105017BD190, Shahar Miah — "Check in issue (daily)"
**Status: KEEP OPEN — recurring GPS issue at site.**
**Closeable: CONFIRM THEN CLOSE** — after deploy, verify his daily check-in/out at Khiran Mall normalizes.

Finding: Shift Assignment present (Night 17:00–05:00, Foodhall Khiran Mall, radius 500 m — very
generous). Reported daily check-in/out difficulty with screen video attached.

Root cause: **B/E** — GPS acquisition at an indoor mall location; radius is already 500 m so the
fence is not the constraint.

Resolution note to post:
> Investigated. Shift and geofence (Khiran Mall, 500 m) are correct — the fence is already large,
> so this is the app's GPS acquisition at an indoor location, not a boundary problem. Fixing in
> the mobile app (GPS timeout/retry + accuracy tolerance). Interim: check in near an entrance with
> clear sky view. Keeping open against the app fix.

---

## 19147 — m.mothaffar@one-fm.com — "One-FM mobile website not saving login"
**Status: KEEP OPEN — confirmed code bug.**
**Closeable: CLOSE ON DEPLOY** — Fix A resolves it directly.

Root cause: **A** — since the May-2026 switch to OAuth2 login, the access token expires after
~1 hour and the app discards the `refresh_token`, so users are forced to re-enter ID + password
on the next check-in/out.

Resolution note to post:
> Confirmed. This started when login moved to OAuth2 tokens that expire after ~1 hour; the app
> wasn't keeping you signed in across that expiry. We are fixing the app to persist and use the
> refresh token so you stay logged in and don't have to re-enter your ID/password each check-in.
> Keeping open against the fix.

---

## 19145 — a.alazmi@one-fm.com — "Check in Location wrong (said outside; showed Burj Humoud not Mahboula)"
**Status: KEEP OPEN — confirmed timing + display bug.**
**Closeable: CLOSE ON DEPLOY** — Fix C corrects the label; confirm with reporter next time a shift request applies.

Root cause: **C** — a Shift Request moving the employee to Mahboula for the day only takes effect
once its `status=Approved` and the morning cron rewrites the Shift Assignment site; before ~08:00
the app falls back to the old site (Burj Humoud), which is why it "fixed itself a few minutes
after 8am." Separately, the displayed site name is always taken from `Operations Shift.site`,
independent of the geofence actually used, so the label can read "Burj Humoud" even after the
correct coordinates are in effect.

Resolution note to post:
> Confirmed. Two things combined: (1) the shift-request site change to Mahboula only becomes
> active once approved and the morning process runs (~08:00), so before that the app used the old
> Burj Humoud location — this is why it corrected itself after 8am; (2) the site *name* shown was
> pulled from the wrong field, so it displayed Burj Humoud even when the correct Mahboula geofence
> was in use. We are fixing the site-name display now, and reviewing the approval timing. Keeping
> open against the fix.

---

## 19129 — a.ali@one-fm.com — "'Locating' for a long time / multiple attempts"
**Status: KEEP OPEN — the primary symptom of the app GPS bug.**
**Closeable: CLOSE ON DEPLOY** — Fix B resolves it directly.

Root cause: **B** — check-in screen GPS call has no timeout and no retry; the shift-list button is
hidden behind a blocking "Locating…" state. Weak GPS = spins indefinitely.

Resolution note to post:
> Confirmed. The "Locating…" hang is a known issue in the app's location handling — the GPS call
> has no timeout or automatic retry and the button is blocked while locating. We are fixing exactly
> this (timeout + retry + accuracy tolerance, and letting you tap check-in without waiting on the
> spinner). Keeping open against the fix.

---

## 19120 — j.alsharqawi@one-fm.com — "Location not occur / doesn't get location"
**Status: KEEP OPEN — same app GPS bug (no permission pre-check).**
**Closeable: CLOSE ON DEPLOY** — Fix B resolves it directly.

Root cause: **B** — no explicit location-permission check/request before `getCurrentPosition`, and
no timeout/retry, so a permission or signal problem surfaces as a silent "no location."

Resolution note to post:
> Confirmed — part of the same location-handling fix. The app doesn't currently check location
> permission up front or retry on failure, so a permission/signal problem shows up as "no
> location." Interim: ensure location permission is granted for the app/site and location services
> are on. Fixing in the app. Keeping open against the fix.

---

## 19121 — 2409013NP179, Prakash Adhikari — "Check In and Out Not Working"
**Status: CLOSE — stale / not reproduced. Attendance data contradicts the complaint.**
**Closeable: CLOSE NOW** — no deploy needed.

Finding: Shift Assignment present daily (Day 06:00, KITC → 360 Tennis Parking, 500 m). Check-in
06:00–06:17 and check-out ~18:20 recorded cleanly *every day* incl. 02-08 (05:55). His 6 KITC
colleagues use the identical geofence and also check in fine. No failure pattern exists.

Resolution note to post:
> Reviewed your check-in records for the past two weeks — check-in (~06:00) and check-out (~18:20)
> are recording correctly every day, and your site geofence matches your colleagues'. This looks
> to have been a one-off/transient at the time of reporting and is not currently reproducing.
> Closing as resolved — please reopen if it recurs, noting the exact date/time.

---

## 19122 — 2502049KE193, Brian John Masumbuko — "Check In / Out option not showing"
**Status: CLOSE — stale / by-design window. Attendance data contradicts the complaint.**
**Closeable: CLOSE NOW** — no deploy needed.

Finding: Shift Assignment present daily (Afternoon 12:00–24:00, 360 Food Hall, 250 m). Check-in
~12:05–12:25 and check-out ~00:00 recorded cleanly every day. The "option not showing" is
consistent with looking before the 12:00 window (the button only appears once the check-in window
opens — working as designed).

Resolution note to post:
> Reviewed your records — you're checking in around 12:00 and out around midnight every day
> without gaps. The check-in button only appears once your shift's check-in window opens (shortly
> before 12:00), so if it was checked earlier in the day it correctly showed nothing. Not
> reproducing as a fault. Closing as resolved — reopen with an exact time if it happens inside your
> shift window.

---

## 19123 — 2101123GH176, Kobi Owusu Ntim — "Check in and Out Option not showing"
**Status: CLOSE — stale / not reproduced. Attendance data contradicts the complaint.**
**Closeable: CLOSE NOW** — no deploy needed.

Finding: Shift Assignment present daily (Night 18:00–06:00, 360 Food Hall, 250 m). Check-in
~18:15–18:27 and check-out ~05:45 recorded cleanly every day. No failure pattern.

Resolution note to post:
> Reviewed your check-in records — check-in (~18:15) and check-out (~05:45) are recording every
> day without gaps. Not currently reproducing. Closing as resolved — please reopen with the exact
> date/time if it recurs.

---

## 19142 — 1912027NP198, Bel Bahadur Pariyar — "Attendance Check In issue"
**Status: LIKELY CLOSE — single bad day, otherwise clean.**
**Closeable: CLOSE NOW** — no deploy needed (unless he reports it's still daily).

Finding: Shift Assignment present daily (Day 06:30–18:30, Al Kout Mall Car Park, Al-kout Fahaheel
300 m). Clean IN/OUT every day *except 29-07*, when check-in didn't succeed until 08:33 (~2 hrs
late) and no check-out was recorded. Isolated GPS incident.

Resolution note to post:
> Reviewed your records — check-in/out is recording correctly on all days except 29-07, when
> check-in was delayed to 08:33 and the check-out didn't record (an isolated GPS issue that day).
> The underlying app location handling is being improved. If 29-07 attendance needs correcting,
> raise an Attendance Request. Closing as resolved unless you're still seeing daily issues.

---

## Summary

| Ticket | Employee | Verdict | Root cause | Closeable |
|--------|----------|---------|-----------|-----------|
| 19121 | Prakash | CLOSE (stale) | — | CLOSE NOW |
| 19122 | Brian | CLOSE (stale/by-design) | D | CLOSE NOW |
| 19123 | Kobi | CLOSE (stale) | — | CLOSE NOW |
| 19142 | Bel Bahadur | CLOSE (single bad day) | B | CLOSE NOW |
| 19147 | Mothaffar | KEEP (code bug) | A | CLOSE ON DEPLOY |
| 19145 | Al Azmi | KEEP (code bug) | C | CLOSE ON DEPLOY |
| 19129 | Ambrin Ali | KEEP (code bug) | B | CLOSE ON DEPLOY |
| 19120 | Al Sharqawi | KEEP (code bug) | B | CLOSE ON DEPLOY |
| 19140 | Ebenezer | KEEP (chronic) | B/E | CONFIRM THEN CLOSE |
| 19171 | Muhammed Sidhiqu | KEEP (check-out fails) | B | CONFIRM THEN CLOSE |
| 19112 | Shahar Miah | KEEP (chronic) | B/E | CONFIRM THEN CLOSE |

Two code fixes drain most of the recurring volume: **(A)** OAuth refresh-token flow and
**(B)** the app GPS handling. **(C)** is a small backend display fix for 19145.
