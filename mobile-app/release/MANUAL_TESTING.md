# AcePharm Mobile — Manual QA Test Plan

**App:** AcePharm (`com.acepharm.app`) · **Build under test:** v0.1.0 · **Platforms:** iOS & Android

This is the pre-release manual verification pass for the AcePharm mobile app. Automated
`flutter test` coverage (116 tests) already checks widget behaviour in isolation — this document
covers what automated tests can't: real devices, real network conditions, and end-to-end flows
across screens.

## How to use this document

- Run through every section on **one iOS device/simulator and one Android device/emulator** at
  minimum. Note the specific model/OS version in the sign-off table at the end.
- Check a box only when you've personally verified the behaviour — don't check based on reading
  the code.
- For anything that fails, use the bug template at the bottom instead of just noting "fails."
- Sections are ordered to match the natural first-run user journey. Later sections assume earlier
  ones pass (e.g., Progress testing assumes you have real practice attempts on the account).

## Test account setup

Use a fresh email (or delete/recreate the account via the app's own Delete Account flow between
runs) — testing onboarding and first-attempt telemetry against an already-onboarded account gives
false confidence.

---

## 1. Authentication

### 1.1 Sign up
- [ ] Empty form → tapping "Create account" shows both "Enter a valid email address" and "Use at
      least 8 characters" without calling the network.
- [ ] Password field: typing shows the strength meter live (Weak/Fair/Strong with 1/2/3 filled
      segments), and it's hidden entirely when the field is empty.
- [ ] Confirm-password mismatch is caught before submission ("Passwords do not match").
- [ ] Successful sign-up lands directly in onboarding Step 1 (no separate "verify email" gate).
- [ ] Signing up with an email that already has an account shows "An account already exists for
      that email." — not a raw error.

### 1.2 Log in
- [ ] Empty form → "Enter a valid email address" / "Enter your password", no network call.
- [ ] Wrong password → "Incorrect email or password." (not "wrong-password" or a stack trace).
- [ ] Correct credentials → lands on the dashboard if already onboarded, or onboarding Step 1 if
      not.
- [ ] "Forgot password?" opens the reset screen; "Sign up" opens the sign-up screen.

### 1.3 Forgot password
- [ ] Invalid email format is caught client-side before any network call.
- [ ] Valid email → confirmation view ("Reset link sent") replaces the form; the form is not
      still reachable to resubmit.
- [ ] "Back to login" returns to the login screen.
- [ ] The actual reset email arrives and its link successfully resets the password (test against
      a real inbox at least once per release).

### 1.4 Session invalidation
- [ ] With the app signed in, revoke the session from the Firebase console (or wait for a token
      to genuinely expire) and trigger any API call. The app should fall back to the login screen
      on its own, not hang on a permanently-failing screen.

---

## 2. Onboarding (5 steps)

- [ ] Step 1 (Training stage): all 6 options render (MPharm Year 2/3/4, Foundation Trainee,
      Oriel, IP); Continue is disabled until one is picked.
- [ ] Step 2 (Primary goal): the 4 presets plus "Other" with a free-text field that must be
      non-empty before Continue enables.
- [ ] Step 3 (Exam date): optional — Continue works with no date set.
- [ ] Step 4 (Daily goal): stepper respects its min/max bounds; defaults to 20.
- [ ] Step 5 (University): list is populated (29 UK MPharm schools should be present — confirms
      the university seed reached production); optional, Continue works either way.
- [ ] Back button works from every step except Step 1 (no back arrow shown there).
- [ ] "Finish" on Step 5 submits and lands on the dashboard.
- [ ] Killing the app mid-onboarding and reopening it resumes at onboarding (not skipped),
      since `hasCompletedOnboarding` wasn't set server-side yet.
- [ ] Submission failure (e.g., airplane mode at the Finish tap) shows an inline error and stays
      on the wizard rather than losing the collected answers.

---

## 3. Dashboard

- [ ] Revision ring shows the real `answered/target` count for today, not a placeholder.
- [ ] Exam countdown ticker appears only when an exam date was set during onboarding, and reads
      correctly (singular "day" at exactly 1, "today" at 0, no negative count past the date).
- [ ] Weekly Ace Clinical Insight card loads and shows a real paragraph (not stuck loading).
- [ ] Recommendation card shows an explicit reason ("Recommended because...") — never an
      unexplained suggestion.
- [ ] App bar icons all work: Progress, Subscription, Settings, Logout.
- [ ] Logout returns to the login screen and a subsequent app relaunch does **not** auto
      sign back in.

---

## 4. Session Builder → Practice

### 4.1 Session Builder
- [ ] All 19 GPhC domains are selected by default; "Clear all" and individual toggles work.
- [ ] Deselecting all domains disables "Start session" with an explanatory message.
- [ ] Switching Learn ↔ Timed Exam mode re-estimates the available question count.
- [ ] "Start session" with zero available questions for the current filter is handled gracefully
      (no crash, clear message).

### 4.2 Question screen — core loop
- [ ] Submit is disabled until **both** an option and a confidence rating are chosen (Product
      Invariant #2).
- [ ] Selecting an option before submitting shows **no** green/red colour or check/cross icon
      anywhere (Product Invariant #1 — zero pre-submission colour).
- [ ] After submitting, feedback always pairs an icon **and** a text label **and** colour — never
      colour alone (Product Invariant #3).
- [ ] Every incorrect option shows its own distinct rationale, not a single shared explanation
      (Product Invariant #4).
- [ ] "Cover options" toggle hides the option list; tapping the hidden-state banner reveals it
      again; the toggle disables once answered.
- [ ] First-attempt badge is correct: shows "first attempt" language only the very first time a
      question is answered, and different language on repeat attempts of the same question.
- [ ] Bookmark icon toggles and persists — leave the question and come back, or restart the app,
      and the bookmark state should hold.
- [ ] The notes editor opens, saves, and reopens with the saved note.

### 4.3 Ask Ace
- [ ] "Ask Ace about this question" appears only after an explanation is available.
- [ ] A normal clinical question gets a grounded answer with at least one citation shown.
- [ ] A question clearly outside the reviewed curriculum (e.g., ask about an unrelated drug class
      never covered) gets the graceful refusal — visually distinct (neutral, not styled like a
      confident answer) and never a fabricated answer.

### 4.4 Timed Exam mode
- [ ] Countdown timer visibly runs and the mode withholds rationales until the question is
      answered, matching the "Pearson VUE" exam-condition framing.

---

## 5. Offline resilience (Product Invariant #6)

This is the newest and highest-risk area — test it thoroughly on a real device, not just a
simulator (simulators can behave oddly around airplane mode).

- [ ] Start a question, enable **airplane mode**, then submit. Expect: no hard error — a neutral
      "Saved — you're offline. This will be graded once you're back online." message, and the
      footer offers "Next question" (not stuck on "Submit answer").
- [ ] While still offline, answer 2–3 more questions the same way.
- [ ] Return to the dashboard while still offline — a banner reading "N answers will sync once
      you're back online" should show the correct count.
- [ ] Re-enable connectivity. Within a few seconds (no manual action required), the banner count
      should drop to zero as the queued answers sync in the background.
- [ ] Force-quit the app while answers are still queued offline, relaunch with connectivity
      restored, and confirm the queue still flushes automatically (proves the queue survives an
      app restart, not just backgrounding).
- [ ] A **real** server error (not connectivity — e.g., trigger a 500 if you have a way to) still
      shows the old inline "Couldn't submit your answer. Try again." error, not the offline
      notice. This confirms the two failure paths aren't conflated.

---

## 6. Progress & mastery grid

Needs an account with a real mix of correct/incorrect attempts across several subtopics —
either use a seasoned test account or generate attempts first.

- [ ] All 5 pillars render as visibly distinct numbers (First-Attempt, Practice, Repeat,
      Calibration, Coverage) — confirm none of them are silently equal/merged by coincidence of
      test data; if they're suspiciously identical, generate more varied attempts and recheck.
- [ ] Confidence Calibration grid shows Overconfident / Calibrated / Underconfident correctly
      given the account's actual confidence-vs-correctness pattern.
- [ ] 19-topic mastery grid shows all expected status labels somewhere across the categories:
      Not started, First pass, Needs attention, Developing, Secure. "Due for review" requires a
      subtopic that reached Secure and then enough time has passed per its last attempt's
      freshness window (1/3/7/21 days depending on correctness+confidence) — this one may need a
      seeded/backdated test account to observe directly within a QA cycle; if so, verify via the
      `progress-calculator.test.ts` backend tests instead and note that here.

---

## 7. Subscription

- [ ] Free/Explorer account: shows "Explorer (Free)" and explanatory copy; no "Manage billing"
      button (there's no Stripe customer to manage).
- [ ] Paid account: shows the correct plan name, renewal date, and a working "Manage billing"
      button that opens the real Stripe customer portal in the browser/webview.
- [ ] A subscription set to cancel at period end shows the "not renewing" warning with the
      correct access-until date.
- [ ] Portal load failure (e.g., airplane mode) shows an inline error, not a crash.

---

## 8. Account deletion

**Use a disposable test account for this section** — it is irreversible.

- [ ] Settings → Account → Delete account opens the two-step flow.
- [ ] Step 1 clearly lists what's lost (practice history, notes, bookmarks, subscription) and has
      a working Cancel that backs out with zero side effects.
- [ ] Step 2 requires the account password; an empty submission is caught client-side; a wrong
      password shows an error and does **not** delete anything.
- [ ] Correct password → the account is actually gone: attempting to log back in with the same
      credentials fails, and the app lands on the login screen automatically (no manual
      navigation needed).
- [ ] If the account had an active paid subscription, confirm in the Stripe dashboard that the
      subscription was cancelled, not left billing a deleted account.

---

## 9. Cross-cutting checks

- [ ] **Touch targets**: spot-check a few option rows and icon buttons with a ruler/accessibility
      inspector — should be ≥44×44pt.
- [ ] **Accessibility**: turn on VoiceOver (iOS) or TalkBack (Android) and swipe through the
      dashboard revision ring, a question screen, and the mastery grid — content should announce
      sensibly, not just raw numbers with no context.
- [ ] **Crash reporting**: trigger a deliberate crash in a debug/staging build (e.g., a temporary
      `throw` behind a hidden button) and confirm it appears in Firebase Crashlytics within a few
      minutes. Remove the trigger before release.
- [ ] **Analytics**: check Firebase Analytics DebugView while manually running through onboarding
      and a practice session — confirm `onboarding_step_viewed`, `onboarding_completed`,
      `session_created`, and `question_answered` events all fire with sensible parameters.
- [ ] **Cold start**: force-quit and relaunch at every major screen (dashboard, mid-question,
      mid-onboarding) — nothing should crash or lose critical state unexpectedly.
- [ ] **Rotation / multitasking** (tablet or split-screen where applicable): no layout overflow
      errors on the question screen or progress grid.

---

## Bug report template

```
**Screen/Flow:**
**Device/OS:**
**Steps to reproduce:**
1.
2.
**Expected:**
**Actual:**
**Screenshot/recording:**
**Severity:** Blocker / Major / Minor / Cosmetic
```

## Sign-off

| Platform | Device/OS version | Tester | Date | Result |
|---|---|---|---|---|
| iOS | | | | ☐ Pass ☐ Pass with notes ☐ Fail |
| Android | | | | ☐ Pass ☐ Pass with notes ☐ Fail |
