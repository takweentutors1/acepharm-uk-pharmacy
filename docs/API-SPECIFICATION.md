# AcePharm REST & Streaming API Specification

- **Version:** v1.0
- **Runtime:** Cloudflare Workers (TypeScript) + D1 (SQLite) + Vectorize
- **Base URL:** `https://acepharm-api.takweencentreuk.workers.dev/api/v1`
- **Auth:** Bearer JWT Token issued by Firebase Authentication, validated at the edge using Google JWKS.

---

## 1. Authentication & User Profile Endpoints

### `GET /api/v1/user/profile`
Fetches the learner's profile, training stage, active subscription tier, and monthly question allowance.

**Headers:**
- `Authorization: Bearer <FIREBASE_ID_TOKEN>`

**Response (200 OK):**
```json
{
  "user": {
    "id": "usr_998a72b",
    "email": "aisha.patel@nhs.net",
    "displayName": "Aisha Patel",
    "stage": "foundation",
    "isPro": true,
    "currentBillingPeriod": {
      "plan": "yearly",
      "status": "active",
      "renewsAt": "2027-09-01T00:00:00Z"
    },
    "freeTierAllowance": {
      "used": 12,
      "limit": 30,
      "resetsAt": "2026-09-28T00:00:00Z"
    }
  }
}
```

---

## 2. Curriculum & Practice Session Endpoints

### `GET /api/v1/curriculum/categories`
Returns all active BNF chapters, high-weighting calculations, and question count distributions.

**Response (200 OK):**
```json
{
  "categories": [
    {
      "id": "cat-cv",
      "name": "Cardiovascular System",
      "bnfChapter": 2,
      "weighting": "high",
      "totalQuestions": 140,
      "unseenCount": 85
    },
    {
      "id": "cat-calc",
      "name": "Pharmaceutical Calculations",
      "bnfChapter": 0,
      "weighting": "high",
      "totalQuestions": 95,
      "unseenCount": 42
    }
  ]
}
```

### `POST /api/v1/sessions/create`
Initializes a new practice session, timed mock exam, or adaptive weak-area drill.

**Request Body:**
```json
{
  "mode": "practice",
  "categoryIds": ["cat-cv", "cat-calc"],
  "questionTypes": ["sba", "calculation"],
  "questionCount": 15,
  "difficulty": "all",
  "timedSeconds": null
}
```

**Response (201 Created):**
```json
{
  "sessionId": "ses_77a281c",
  "totalQuestions": 15,
  "questions": [
    {
      "id": "q-sample-1",
      "publicId": "ACP-CV-0012",
      "difficulty": "medium",
      "questionType": "sba",
      "sector": "community",
      "stem": "A 62-year-old male of Afro-Caribbean heritage...",
      "leadIn": "According to NICE NG136, which is the initial therapy?",
      "options": [
        { "id": "opt-a", "label": "A", "content": "Ramipril 2.5 mg once daily" },
        { "id": "opt-b", "label": "B", "content": "Amlodipine 5 mg once daily" }
      ]
    }
  ]
}
```

---

## 3. Dual-Store Attempt Logging Endpoint

### `POST /api/v1/attempts/submit`
Logs question attempts strictly adhering to the **Dual-Store Attempt Rule** (Milestone 3 & Developer Brief Section 4.2).

**Request Body:**
```json
{
  "sessionId": "ses_77a281c",
  "questionId": "q-sample-1",
  "selectedOptionId": "opt-b",
  "confidence": "high",
  "secondsElapsed": 42,
  "isFirstAttempt": true
}
```

**Execution Logic:**
- If `isFirstAttempt === true` (or no record in `first_attempts`), writes immutably to `first_attempts` for true diagnostic calibration analytics.
- All subsequent practice attempts on the same question write to `practice_attempts`.

**Response (200 OK):**
```json
{
  "isCorrect": true,
  "isFirstAttemptLogged": true,
  "explanation": {
    "summaryTakeaway": "In adults of Black African or African-Caribbean heritage without type 2 diabetes, Step 1 is a CCB.",
    "detailedExplanation": "NICE NG136 specifies CCB monotherapy...",
    "clinicalGuidanceReference": "NICE NG136 (2023 Update)",
    "distractorRationales": {
      "opt-a": "Sub-optimal Step 1 due to lower baseline plasma renin activity.",
      "opt-b": "Correct first-line monotherapy choice."
    }
  }
}
```

---

## 4. Ace AI Clinical Tutor (Streaming Endpoint)

### `POST /api/v1/ace/chat`
Retrieves grounded clinical context from Cloudflare Vectorize and streams real-time conversational explanations from the AI Gateway.

**Request Body:**
```json
{
  "questionId": "q-sample-1",
  "message": "Why is an ACE inhibitor not recommended first-line for this patient?",
  "highlightedText": "Afro-Caribbean heritage",
  "threadId": "th_102938"
}
```

**Response:**
Server-Sent Events (`text/event-stream`) streaming token chunks followed by explicit source citations:
```text
data: {"token": "In"}
data: {"token": " adults"}
data: {"token": " of Black African origin, baseline renin levels..."}
data: {"citation": {"source": "NICE NG136 Section 1.3", "url": "https://nice.org.uk/guidance/ng136"}}
data: [DONE]
```

---

## 5. Stripe Webhooks Endpoint

### `POST /api/v1/stripe/webhook`
Handles subscription lifecycle events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) and syncs user entitlements in D1.
