# ADR 0002: Answer Engine Optimization (AEO) & Structured Data Standards

- **Status:** Accepted
- **Date:** 2026-08-31
- **Deciders:** Takween Centre UK Engineering & SEO Team
- **Consults:** Implementation Plan v3.0, Website Copy v2.0

---

## Context & Problem Statement

Modern student revision queries increasingly flow through AI Answer Engines and Large Language Model search systems (such as Perplexity AI, ChatGPT Search, Claude, and Google Search Generative Experience) alongside standard Google Search. AI crawlers typically do not execute complex client-side JavaScript applications and prioritize structured, highly-referenced semantic data with clear authoritative citations.

## Decision

We have implemented comprehensive **Answer Engine Optimization (AEO)** and **Generative Engine Optimization (GEO)** across the public marketing and content surfaces:

1. **Zero-JS Default Content Delivery:**
   - The marketing hub (`apps/marketing`) is rendered statically using Astro.
   - Core educational concepts, FAQs, pricing tables, and clinical guides are emitted directly as semantic HTML5 elements without client-side rendering requirements.
2. **Schema.org Structured Data Specifications:**
   - **`Organization` Schema:** Embedded globally on every page with `knowsAbout` tags referencing UK pharmacy curricula (GPhC, BNF, NICE, Clinical Pharmacology).
   - **`Product` & `Offer` Schema:** Embedded on `/pricing` with exact GBP prices, terms, and currency details.
   - **`Course` & `EducationalOccupationalCredential` Schema:** Embedded on `/question-bank` to explicitly declare preparation pathways for the GPhC Registration Assessment.
   - **`FAQPage` Schema:** Embedded on `/faq` to directly feed Q&A knowledge graphs.
   - **`CollectionPage` & `Article` Schema:** Embedded on `/blog` and individual clinical guides with authoritative authorship metadata (`AcePharm Clinical Editorial Team`).
3. **OpenGraph and Meta Standards:**
   - Canonical URLs dynamically generated per route.
   - Complete OpenGraph (`og:title`, `og:description`, `og:image`, `og:locale: en_GB`) and Twitter Summary Large Image cards across all layouts.

## Consequences

- Search engines and AI answer engines can crawl, cite, and attribute AcePharm's educational content accurately with zero client execution penalties.
- High Core Web Vitals performance (sub-second LCP and zero CLS).
