# ADR 0003: Dual-Store Attempt Logging & Calibration Analytics

- **Status:** Accepted
- **Date:** 2026-08-31
- **Deciders:** Takween Centre UK Engineering & Learning Analytics Team
- **Consults:** Developer Brief v2.1 (Section 4.2 & Non-Negotiable #14), Implementation Plan v3.0

---

## Context & Problem Statement

Traditional revision question banks calculate a user's readiness using aggregate percentage scores of all attempts combined. This creates a severe **"practice memorization" distortion**:
When a student answers a difficult question incorrectly, reads the explanation, and repeats the question later, their second attempt is almost always correct. If that second attempt replaces or mixes with their first attempt score, their reported accuracy rises to 100%, generating dangerous false confidence for GPhC board exams.

## Decision

We enforce the **Dual-Store Attempt Rule** across our database architecture in Cloudflare D1:

1. **`first_attempts` Table:**
   - Stores the very first response a user ever submits for a specific question ID.
   - **Immutable:** Once recorded, this entry can never be overwritten, modified, or updated by subsequent practice runs.
   - Powers all diagnostic calibration matrices, weak area recommendations, and topic readiness percentiles.
2. **`practice_attempts` Table:**
   - Stores all subsequent repeated attempts on that question.
   - Powers spaced-repetition decay curves, active recall tracking, and recent session reviews.
3. **Calibration Matrix (Confidence vs Accuracy):**
   - Combines pre-submission confidence ratings (1 = Low, 2 = Medium, 3 = High) with first-attempt accuracy:
     - **Calibrated Knowledge:** High Confidence + Correct Answer
     - **Clinical Blind Spot:** High Confidence + Incorrect Answer *(High Priority for Spaced Review)*
     - **Lucky Guess:** Low Confidence + Correct Answer *(Queued for Concept Consolidation)*
     - **Known Gap:** Low Confidence + Incorrect Answer

## Consequences

- Completely eliminates false confidence inflated by repeat question exposure.
- Delivers trustworthy diagnostic signals for MPharm tutors and students.
- Powers adaptive weak area drills based on genuine uncalibrated clinical blind spots.
