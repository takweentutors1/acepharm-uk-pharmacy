# ADR 0004: Hierarchical Content Chunking & Vector Indexing Strategy

- **Status:** Accepted
- **Date:** 2026-08-31
- **Deciders:** Takween Centre UK Engineering & AI Team
- **Consults:** Implementation Plan v3.0, Developer Brief Section 5

---

## Context & Problem Statement

Ace AI is strictly prohibited from answering clinical queries using ungrounded large language model (LLM) training memory. To guarantee that all responses cite reviewed AcePharm rationales, BNF chapters, and NICE guidelines, we require an edge-compatible retrieval-augmented generation (RAG) architecture that runs with sub-100ms vector lookup times.

## Decision

We implement a **hierarchical chunking and vector indexing pipeline** using **Workers AI** and **Cloudflare Vectorize**:

1. **Embedding Model:**
   - Model: `@cf/baai/bge-base-en-v1.5`
   - Output Dimensions: 768
   - Vector Metric: `cosine`
2. **Chunking Strategy:**
   - **Clinical Explanations:** Chunked as atomic units preserving the 4-stage structure (Takeaway Principle + Clinical Rationale + Distractor Rationales A–E + Guideline Links).
   - **BNF Guidelines & Subtopic Notes:** Split into 300–500 token semantic chunks overlapping by 50 tokens, tagged with `bnfChapter`, `therapeuticClass`, and `subtopicId` metadata.
3. **Contextual Retrieval & Scoring:**
   - Vector query candidates (top 6) are hydrated from D1 `content_chunks`.
   - Chunks belonging to the active question context receive a +0.25 confidence boost.
   - Grounded context is injected into the LLM system prompt with strict refusal instructions if similarity is below threshold.

## Consequences

- Zero hallucination risk: Out-of-domain queries gracefully refuse per Non-Negotiable #10.
- Fast edge retrieval: Vectorize lookup occurs in < 50ms inside the Cloudflare Workers execution boundary.
- Transparent citations: Every generated explanation carries direct citations to the underlying question and clinical guidance.
