# AcePharm Data Retention & GDPR Privacy Policy

- **Authority:** Developer Brief v2.1 Section 3.1 & GDPR UK Data Protection Framework
- **Effective Date:** 2026-08-31

---

## 1. Primary Data Storage & Residency

All substantive application data is stored in **Cloudflare D1**, physically pinned to the Western Europe (`weur`) region:
- User Profiles & Learning Goals
- Question Bank & Clinical Explanations
- `first_attempts` (Isolated Calibration Store)
- `practice_attempts` (Spaced Repetition Store)
- Ace AI Conversation Threads & Notes

---

## 2. Retention Schedules by Data Classification

| Data Category | Table / Store | Retention Period | Rationale |
| :--- | :--- | :--- | :--- |
| **First Attempt Scores** | `first_attempts` | **Indefinite** (or account deletion) | Powers lifelong calibration percentiles and baseline clinical competence tracking. |
| **Practice Test Attempts** | `practice_attempts` | **Indefinite** | Required for SuperMemo-2 spaced repetition decay calculations. |
| **Question Notes & Bookmarks** | `question_notes` | **Indefinite** | Student personal revision notes remain accessible even if a paid subscription lapses. |
| **Ace Chat Threads** | `ace_threads`, `ace_messages` | **90 Days Active** (anonymized thereafter) | Retained for student review and clinical oversight; purged of PII after 90 days. |
| **Rate Limit & KV Counters** | `RATE_LIMIT` KV | **1 Hour to 24 Hours** | Ephemeral window counters for fair-use enforcement. |
| **Guest / Anonymous Sessions** | `sessions` (guest) | **30 Days** | Unclaimed temporary sessions are automatically pruned. |

---

## 3. Account Deletion & Right to Erasure

Upon receiving an account erasure request under GDPR Article 17:
1. The user's identity record is permanently deleted from Firebase Authentication.
2. The user record in Cloudflare D1 is pseudonymized or removed, cascading deletion across personal bookmarks, notes, and Ace conversation threads.
3. Aggregated attempt analytics are stripped of identifying user foreign keys to preserve curriculum psychometric validity.
