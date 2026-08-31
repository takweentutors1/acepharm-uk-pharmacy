# AcePharm Documentation Repository Index

Welcome to the central documentation index for **AcePharm** — an evidence-led revision platform designed exclusively for UK MPharm students, foundation trainees, and GPhC registration candidates.

---

## 1. Master Document Registry

| Document | Format | Authority & Status | Description |
| :--- | :--- | :--- | :--- |
| **[IMPLEMENTATION-PLAN.md](file:///Users/pc/acepharm-web-app/docs/IMPLEMENTATION-PLAN.md)** | Markdown | **Active Canonical (v3.0)** | Authoritative technical build reference re-platformed onto Firebase (Auth) + Cloudflare (D1, Vectorize, Workers, Pages), with an Astro + Next.js frontend split. |
| **[AcePharm-Implementation-Plan-v3.0-Firebase-Cloudflare.pdf](file:///Users/pc/acepharm-web-app/docs/AcePharm-Implementation-Plan-v3.0-Firebase-Cloudflare.pdf)** | PDF | Canonical Reference | Styled PDF distribution of the v3.0 Implementation Plan. |
| **[WEBSITE-COPY-EXTRACTED.md](file:///Users/pc/acepharm-web-app/docs/WEBSITE-COPY-EXTRACTED.md)** | Markdown | **Active Verbatim (v2.0)** | Complete copy dictionary, tone of voice rules, banned phrases, and marketing strings. |
| **[AcePharm-Developer-Brief-v2.1.docx](file:///Users/pc/acepharm-web-app/docs/AcePharm-Developer-Brief-v2.1.docx)** | DOCX | Foundational Brief | Product specifications, 26 Non-Negotiables, clinical data rules, and acceptance criteria. |
| **[AcePharm Design System.html](file:///Users/pc/acepharm-web-app/docs/AcePharm%20Design%20System.html)** | HTML | UI/UX Visual Spec | Design system tokens, color palettes, spacing, typography, and component specifications. |
| **[API-SPECIFICATION.md](file:///Users/pc/acepharm-web-app/docs/API-SPECIFICATION.md)** | Markdown | **Active Specification** | Cloudflare Workers REST & Server-Sent Events (SSE) streaming API endpoints. |
| **[CLINICAL-AUTHORING-GUIDE.md](file:///Users/pc/acepharm-web-app/docs/CLINICAL-AUTHORING-GUIDE.md)** | Markdown | **Active Standard** | Clinical question authoring rules, 4-stage explanation schema, and review standards. |
| **[OPERATIONS-RUNBOOK.md](file:///Users/pc/acepharm-web-app/docs/OPERATIONS-RUNBOOK.md)** | Markdown | **Active Operations** | Cloudflare D1 migrations, Vectorize sync, secret rotation, and disaster recovery runbook. |
| **[DATA-RETENTION-POLICY.md](file:///Users/pc/acepharm-web-app/docs/DATA-RETENTION-POLICY.md)** | Markdown | **Active Compliance** | UK GDPR data retention schedules, erasure protocol, and Western Europe residency mapping. |
| **[COPY-COMPLIANCE-MATRIX.md](file:///Users/pc/acepharm-web-app/docs/COPY-COMPLIANCE-MATRIX.md)** | Markdown | **Active Governance** | Compliance verification matrix for tone of voice, banned terms, and disclaimers. |

---

## 2. Architectural Decision Records (ADRs)

Key architectural decisions are documented in the [`docs/adr/`](file:///Users/pc/acepharm-web-app/docs/adr) directory:

- **[ADR 0001: Cloudflare + Firebase Architecture & Frontend Split](file:///Users/pc/acepharm-web-app/docs/adr/0001-cloudflare-firebase-split-architecture.md)**
  - Documents the rationale for scoping Firebase to Authentication only, utilizing Cloudflare D1 as the single relational system of record, and adopting an Astro (Marketing) + Next.js (App) frontend split.
- **[ADR 0002: Answer Engine Optimization (AEO) & Structured Data Standards](file:///Users/pc/acepharm-web-app/docs/adr/0002-aeo-geo-search-engine-optimization.md)**
  - Documents the implementation of zero-JS crawlable marketing pages, JSON-LD schemas (`Organization`, `Product`, `Course`, `FAQPage`, `Article`), and Core Web Vitals optimization.
- **[ADR 0003: Dual-Store Attempt Logging & Calibration Analytics](file:///Users/pc/acepharm-web-app/docs/adr/0003-dual-store-attempt-logging.md)**
  - Documents the database isolation of `first_attempts` from `practice_attempts` to eliminate false practice-repetition inflation.
- **[ADR 0004: Hierarchical Content Chunking & Vector Indexing Strategy](file:///Users/pc/acepharm-web-app/docs/adr/0004-rag-chunking-strategy.md)**
  - Documents the embedding and vectorization pipeline using `@cf/baai/bge-base-en-v1.5` and Cloudflare Vectorize for sub-50ms RAG retrieval.

---

## 3. Product & Technical Invariants (Non-Negotiables)

1. **One System of Record:** Cloudflare D1 is the single relational source of truth for users, questions, attempts, subscriptions, and Ace threads. Firebase handles identity only.
2. **Dual-Store Attempt Rule:** First attempts are immutably isolated in `first_attempts` for true calibration analytics; all subsequent practice attempts are logged in `practice_attempts`.
3. **Ace AI Grounding:** Ace queries exclusively from reviewed AcePharm rationales, subtopic notes, and cited UK clinical guidelines—never ungrounded LLM recall.
4. **Verbatim Copy & British English:** All product copy adheres strictly to the conventions and banned phrase prohibitions in [`WEBSITE-COPY-EXTRACTED.md`](file:///Users/pc/acepharm-web-app/docs/WEBSITE-COPY-EXTRACTED.md).
