# ADR 0001: Cloudflare + Firebase Architecture & Frontend Split

- **Status:** Accepted
- **Date:** 2026-08-31
- **Deciders:** Takween Centre UK Engineering & Product Team
- **Consults:** Implementation Plan v3.0, Developer Brief v2.1

---

## Context & Problem Statement

The original architecture plan (v2.1) specified Next.js on Vercel, managed PostgreSQL + pgvector (UK/EU), Prisma, and Auth.js. While technically functional, that hosting topology incurs fixed hosting charges of approximately £40–£120/month before acquiring any paid subscribers. Furthermore, deploying a single unified Next.js application across both public marketing pages and the authenticated learner portal compromised zero-JS Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) for AI web crawlers.

## Decision

We have adopted a modern, zero-fixed-cost split architecture:

1. **Identity & Authentication:** Scoped exclusively to **Firebase Authentication** on the Spark free tier (email/password, magic links, automated transactional auth emails, token issuance).
2. **System of Record & Storage:** Centralised entirely on **Cloudflare**:
   - **Cloudflare D1:** Single relational SQLite database for all application state (users, questions, dual-store attempts, subscriptions, Ace threads). Located in Western Europe (`weur`) for GDPR alignment.
   - **Cloudflare Vectorize:** Vector database replacing pgvector for Ace RAG retrieval.
   - **Cloudflare Workers:** Serverless compute for API routes, Stripe webhooks, and AI gateway orchestration.
   - **Cloudflare Pages:** Edge hosting for frontends.
3. **Frontend Split:**
   - **`apps/marketing`:** Built with **Astro**. Ships zero JavaScript by default with selective client islands for interactive UI (mobile nav drawer, pricing toggle, FAQ accordions, topic filters). Delivers optimal Core Web Vitals and full crawlability for Google and AI Answer Engines (Perplexity, GPTBot, ClaudeBot).
   - **`apps/web` & `apps/admin`:** Built with **Next.js (App Router)**. Houses interactive, authenticated, stateful surfaces (session builder, question runner, spaced repetition, admin authoring). Explicitly marked with `noindex`.

## Consequences

### Positive
- **£0 Fixed Infrastructure Baseline:** Capable of scaling through early growth on free tiers.
- **Superior AEO/GEO Indexing:** Plain HTML rendering on marketing pages ensures rapid ingestion by search and AI answer engines.
- **Data Integrity:** Eliminates split-brain database concerns by strictly enforcing Cloudflare D1 as the single relational system of record.
- **Isolated Attempt Analytics:** Dual-store schema cleanly separates first attempts from repeated practice attempts.

### Trade-offs & Mitigations
- **Two Frontend Codebases:** Managed seamlessly via a pnpm workspace and shared design token package (`@acepharm/design-tokens`) and UI primitives (`@acepharm/ui`).
