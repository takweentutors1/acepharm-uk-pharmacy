---
name: acepharm-design
description: Use this skill to generate well-branded interfaces and assets for AcePharm UK, the pharmacy revision platform built for UK MPharm students. Contains design tokens, typography, colors, components, and UI patterns for both learner app and marketing site.
user-invocable: true
---

# AcePharm Design System Skill

Read the **readme.md** at the root of this skill to understand AcePharm's brand, product model, and visual foundations.

## Quick Start

**For prototypes or throwaway mockups**: copy assets from `assets/`, reference tokens from `styles.css` via Tailwind, and build static HTML. Use the component patterns from `guidelines/` as visual reference.

**For production code**: import React components from `components/` (Button, Card, OptionButton, etc.). All components use CSS custom properties from `styles.css`, so they integrate seamlessly with the shared Tailwind config used by both the Astro marketing site and Next.js learner app.

**For layout & spacing**: use the 8px-based scale (`--space-1` through `--space-9`), corner radii tokens, and shadow tokens. These are available as CSS variables and also mapped into Tailwind utilities.

**For copy**: every string in the product comes verbatim from the Website Copy document (not in this skill, but referenced in the readme). Do not paraphrase or invent microcopy.

## Design Principles

- **Created by pharmacists. Built for pharmacy students.** Real pharmacy education needs, not generic gamification.
- **Never patronising.** Intelligent, calm, precise, supportive tone. British English throughout.
- **Grounded Ace.** The AI tutor answers only from reviewed content; never publishes; always cites.
- **Dual-store integrity.** First attempts are permanent and immutable; practice history is clearable. This distinction powers all analytics.
- **Uninterrupted learning.** Upgrade prompts never interrupt active learning.
- **Honest progress language.** Uses: "Not started", "First pass", "Needs attention", "Developing", "Secure", "Due for review". Never "mastered" or "failed".

## Key Assets

- `styles.css` — global entry point; links to all token files
- `tokens/` — colors, typography, spacing, shadows (CSS custom properties)
- `guidelines/` — specimen cards (HTML) showing foundations and component patterns
- `components/` — reusable React primitives (Button, Card, OptionButton, etc.)
- `readme.md` — full design system documentation, color specs, typography scale, spacing rules, motion guidance

## Visual Foundations

**Primary colours**: Indigo (`#4F46E5`) and Teal (`#0F766E`).
**Semantic colours**: Success (`#15803D`), Danger (`#B91C1C`), Warning (`#B45309`), Info (`#0369A1`).
**Typography**: Geist (sans-serif) and Geist Mono (monospace). Responsive type scale from 36–53px display down to 13px micro.
**Spacing**: 4px base unit (–space-1 through –space-9), corner radii 8–22px, three shadow levels (subtle, card, modal).

## When to Use This Skill

✅ Building interfaces for AcePharm: learner app, admin portal, marketing site, prototypes.
✅ Creating UI mocks or throwaway prototypes that follow AcePharm's brand.
✅ Producing static HTML pages with AcePharm styling.

❌ Not for: completely different product brands, or software that needs to ignore AcePharm's tone/identity.

## Building with AcePharm Components

1. **Link styles**: `<link rel="stylesheet" href="path/to/styles.css">`
2. **Import components**: `import { Button, Card } from '@acepharm/components'`
3. **Use tokens in inline styles or Tailwind**: `className="bg-indigo text-white p-5 rounded-[15px]"`
4. **Follow layout rules**: max-width containers (1140px full, 760px narrow), responsive sections, flex/grid with gap (not margin).
5. **Respect accessibility**: WCAG 2.2 AA, multi-sensory feedback, `prefers-reduced-motion` fallbacks, keyboard navigation.

If you're unsure about tone, spacing, colors, or whether a pattern exists in the design system, ask — don't invent. The readme and specimen cards are your source of truth.
