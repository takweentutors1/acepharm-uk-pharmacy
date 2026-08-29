# AcePharm Design System

## Company Context

**AcePharm UK** is a subscription revision platform built by pharmacists, exclusively for UK pharmacy students (MPharm years 2–4), foundation trainees, and GPhC candidates. The platform combines curriculum-mapped practice questions with clinical explanations, honest analytics, and **Ace** — an AI tutor grounded in AcePharm's own reviewed content.

### Product Model
- **Explorer (Free)**: 30 questions/month, permanent access, no card required
- **Monthly Pro**: £4.99/month, unlimited questions, full Ace access
- **Yearly Pro**: £49.99/year, same features as Monthly, saves £9.89/year

### Core Design Principles
1. **Created by pharmacists. Built for pharmacy students.** Every feature and piece of copy reflects real pharmacy education needs.
2. **Never patronising.** Intelligent, calm, precise, supportive tone — encouraging without false cheerleading.
3. **Grounded Ace.** The AI tutor answers only from AcePharm's reviewed content; never publishes; always cites; never gives patient-specific advice.
4. **Dual-store integrity.** First attempts are permanent and immutable; practice history is user-clearable. This distinction is non-negotiable and foundational to all analytics.
5. **Uninterrupted learning.** Upgrade prompts never interrupt active learning. A learner sees the full question explanation before any paywall.
6. **Honest progress language.** Uses: "Not started", "First pass", "Needs attention", "Developing", "Secure", "Due for review". Never "mastered" or "failed".

## Source Materials

**Codebase (mounted)**: `marketing/` — Astro-based public site with Tailwind config, shadcn-style UI primitives in `packages/ui/`, shared design tokens in `packages/design-tokens/`.

**Documents (uploaded)**:
- `AcePharm-Developer-Brief-v2.1.docx` — product requirements, 26 non-negotiables, data model, Ace principles
- `AcePharm-Website-Copy-v2.0.docx` — every string the product needs, organised by page and feature
- `WEBSITE-COPY-EXTRACTED.md` — plaintext version of the copy document
- `IMPLEMENTATION-PLAN-v3.0-Firebase-Cloudflare.pdf` — engineering and infrastructure roadmap
- `acepharm-prototype-vision.html` — interactive prototype with visual tokens and component patterns

## Design Foundations

### Visual Identity

**Logo & Mark**: The brand identity uses a logotype "AcePharm" with a gradient mark (indigo→teal) in geometric form. No standalone logo files provided in mounted sources; the mark is rendered inline where needed using the design tokens below.

**Typography**: Dual-font hierarchy for clarity and approachability:
- **Display/Headlines**: Geist (400, 500, 600, 700) — clean, modern, legible at any scale
- **Body/UI**: Geist (same weights) — matches headlines for cohesion; no serif fallback
- **Monospace**: Geist Mono (400, 500) — used for question IDs, calculations, code snippets

**Type Scale** (responsive, using `clamp()`):
- Display: 36–53px (section hero titles, with -3.5% letter-spacing)
- H1: 32–48px
- H2: 27–38px
- H3: 20–26px
- H4: 19px
- Body Large: 18px
- Body: 16px (default)
- Small: 14px
- Micro: 13px
- Eyebrow: 13px, 600 weight, 9% letter-spacing, uppercase

### Color System

**Primary Palette**:
- **Indigo** (`#4F46E5`): Primary action, highlights, interactive states. Deep variant (`#3730A3`) for hover/pressed states.
- **Teal** (`#0F766E`): Secondary accent, alternative actions, calm states.
- **Ink** (`#111827`): Primary text, dark backgrounds.
- **Slate** (`#64748B`): Secondary text, labels, muted content.

**Semantic Colors**:
- **Success** (`#15803D`): Correct answers, positive indicators. Wash: `#F0FDF4`
- **Danger** (`#B91C1C`): Incorrect answers, destructive actions, errors. Wash: `#FEF2F2`
- **Warning** (`#B45309`): Caution, attention-needed items. Wash: `#FFFBEB`
- **Info** (`#0369A1`): Information, tooltips, secondary messaging.

**Neutral Palette**:
- **Canvas** (`#F8FAFC`): Page background, subtle UI backgrounds
- **Surface** (`#FFFFFF`): Card/panel backgrounds, form inputs
- **Border** (`#E2E8F0`): Dividers, input borders, card borders

### Spacing System

Responsive, 4px-based scale:
- `--s1`: 4px
- `--s2`: 8px
- `--s3`: 12px
- `--s4`: 16px
- `--s5`: 24px
- `--s6`: 32px
- `--s7`: 48px
- `--s8`: 64px
- `--s9`: 96px

Used in Tailwind as `p-*`, `m-*`, `gap-*` (0.25rem base unit).

### Corner Radii

- **Buttons**: 11px (`--r-btn`)
- **Inputs**: 10px (`--r-input`)
- **Cards**: 15px (`--r-card`)
- **Panels**: 22px (`--r-panel`)

### Shadows

**Card shadow**: `0 24px 60px -28px rgba(17,24,39,.28)` — used on hero product visuals and elevated cards
**Modal shadow**: `0 30px 70px -20px rgba(17,24,39,.5)` — used on modals and overlays
**Toast shadow**: `0 12px 30px -8px rgba(0,0,0,.4)` — used on toasts and notifications
**Subtle shadows** on hover/interactive elements use `0 0 0 3px rgba(79,70,229,.13)` (inset focus ring)

## Content Fundamentals

### Tone & Voice

**How copy is written**: Intelligent, calm, precise, supportive. Encouraging but never patronising. Plain British English throughout.

**Key conventions**:
- British English spelling: "organise", "personalised", "analyse", "programme"
- "Medicines" not "meds"
- Micrograms written in full, never "mcg" or "µg"
- 12-hour clock: "3:00 pm"
- Dates: "18 September 2027"
- No emoji
- No colloquial abbreviations or slang

**Banned phrases** (non-negotiable; they contradict the brand):
- "You failed" / "You are falling behind" / "Don't lose your streak" / "We miss you!"
- "Only [X] days left" / "Guaranteed" / "Everything you need to pass" / "Complete curriculum coverage"
- "Mastered" (as a progress status — use "Secure" instead)
- Any claim of endorsement by the GPhC, NHS, NICE, universities, or exam bodies
- "AI-powered" as a standalone selling point (say what it does, not what it runs on)

**Preferred alternatives**:
- "Not quite. Let's work through it." instead of "Wrong!"
- "This topic needs another look" instead of "You are falling behind"
- "You are building consistency" instead of "Don't lose your streak"

### Accessibility (WCAG 2.2 AA)

- Multi-sensory feedback: correct/incorrect uses border + icon + colour + explicit text, never colour alone
- Keyboard navigation: full support, visible focus states on every interactive element
- Text resizes to 200% without loss of function
- `prefers-reduced-motion` respected on all animations (Ace orb, transitions, hero animationsin)
- No CAPTCHA as sole auth; no auto-playing audio
- Touch targets minimum 44×44px
- ARIA live regions announce question feedback and session events

## Visual Motifs & Foundations

### Gradients & Backgrounds

- **Hero background**: Subtle radial gradient (indigo → teal, 70% transparent) centred high on the page, blurred to avoid visual noise
- **Panel backgrounds**: Always white/surface; subtle tint washes (`--indigo-wash`, `--danger-wash`, etc.) used only for semantic information panels (success states, error states, cautions)
- **Ace visual**: Gradient orb (indigo → teal → purple, animated 360° rotation on 9s cycle); conic gradient with responsive-motion fallback

### Interactive States

- **Hover**: Border colour shifts to indigo (on borders), or background tint lighten (on filled buttons); transform slight (–2px translateY on cards)
- **Active/Pressed**: Border becomes indigo with inset box-shadow; background saturates; transform small (+1px translateY on buttons to show press feedback)
- **Disabled**: 45% opacity, cursor not-allowed, no pointer events
- **Focus**: 3px solid indigo outline, 2px offset, 4px border-radius

### Cards & Containers

- **Card** (`.card`): 1px border (border colour), 15px radius, white background, 24px padding, 1px solid border
- **Panel** (`.panel`): Taller version for page-level containers; 22px radius, 32px padding
- **Disclosure/accordion**: Header has canvas background, body has white; border top between sections

### Animations & Motion

- **Entrance**: slide + fade; 200ms for modals, 250ms for panels, 25ms for toasts
- **Exit**: fade; 150ms for toasts
- **Transitions**: border-color, background, transform all 150ms cubic-bezier(.15); 100ms on buttons
- **Easing**: `cubic-bezier(.22,.85,.3,1)` for entrance, `cubic-bezier(.4,0,.2,1)` for SVG draws
- **Respect `prefers-reduced-motion`**: all animations collapse to instant show/hide

### Hover & Press States

- Option/choice tiles: border shifts to indigo on hover; selected gets full indigo background with inset shadow
- Buttons: background darkens on hover; slight translateY(-1px) on active
- Links: underline on hover (never by default)
- Confidence selectors: border → indigo, background → indigo-wash on selection

### No Motifs to Avoid

- Bluish-purple gradient backgrounds (already using indigo, avoid redundant gradients)
- Emoji cards or decorative emoji (brand voice does not include emoji)
- Left-border-only accent on cards (not in the prototype; avoid this pattern)
- Rounded corners with left-border accent (same — omit this combination)

## Iconography

**Approach**: The prototype uses minimal inline SVGs and Unicode symbols. No dedicated icon system or icon font is embedded.

**Current usage**:
- Tick marks (✓): `<svg>` with success colour
- Chevrons/arrows: Unicode `›`, `‹`, `↓`
- Dots/indicators: CSS pseudo-elements, radio buttons
- Ace orb: CSS conic gradient animation

**Future expansion**: If an icon library is needed, use [Heroicons](https://heroicons.com/) (2px stroke, 24×24 default) or [Lucide](https://lucide.dev/) (same stroke weight). Copy SVG files into `assets/icons/` and reference them as imports, never load from CDN.

## Component Inventory

The design system defines reusable primitives organised by concern:

### Forms & Input
- **Input** (text, email, password, number)
- **Select** (dropdown)
- **Checkbox** (multi-select)
- **Radio** (single-select)
- **Textarea** (multi-line text)
- **Label** (associated control label)
- **Field wrapper** (label + input + error/hint)

### Feedback & Status
- **Button** (primary, secondary, ghost, danger; sizes: default, sm, lg; states: default, hover, active, disabled)
- **Pill/Badge** (label with optional colour variant: indigo, teal, warn, danger, success)
- **Toast** (ambient notification; auto-dismiss on success, persist on error)
- **Modal/Dialog** (blocking overlay; focus trap, keyboard close on Escape)
- **Inline banner** (persistent condition: offline, AI unavailable, degraded service)
- **Error message** (field-level, form-level, or full-page)

### Content & Layout
- **Card** (bordered container, typically contains one concept)
- **Panel** (larger, page-level container)
- **Grid** (responsive: 2/3/4 columns, collapse to 1 on mobile)
- **Table** (horizontal scroll on mobile, sticky header)
- **Section** (padding wrapper, typically `.sec` for 96px top/bottom)

### Navigation & Disclosure
- **Nav links** (header navigation, active state underline or background tint)
- **Tabs** (horizontal, sticky underline on active)
- **Breadcrumbs** (hierarchy indicator)
- **Disclosure/accordion** (collapsible section)
- **Pagination** (numbered grid, current highlighted)

### Question & Learning
- **Question stem** (the problem statement)
- **Options** (A–E choice buttons; border-based selection; semantic colour on feedback)
- **Confidence selector** (4-way grid: Guessing, Unsure, Fairly sure, Certain)
- **Explanation section** (structured, collapsible subsections with distinct typography)
- **Subtopic notes** (horizontally scrollable table, responsive collapse on mobile)
- **Flashcard** (flip to reveal; progress counter)
- **Revision planner** (day-based grid with rest/focus/review labels)

### Ace (AI Tutor)
- **Ask Ace panel** (collapsed by default below explanations)
- **Thread display** (user message ↔ Ace message bubbles with citations)
- **Quick prompts** (chip buttons for common intents: simplify, why not, similar, test, exam)
- **Citation block** (link to source with metadata)
- **Calculation coach** (line-by-line working checker)
- **Consultation simulator** (scenario player with patient avatar, rubric feedback)

### Session & Progress
- **Session builder** (filters: category, subtopic, mode, count)
- **Session progress bar** (sticky header with question counter and timer)
- **Session summary** (score, time, recommended next)
- **Dashboard cards** (recommended next, daily goal, weekly progress, weak areas, bookmarks)
- **Progress page** (first-attempt vs practice accuracy, confidence matrix, coverage map, status labels)

## Design System Structure

```
acepharm-design-system/
├── readme.md (this file)
├── SKILL.md
├── styles.css (root @import list)
├── tokens/
│   ├── colors.css
│   ├── typography.css
│   ├── spacing.css
│   └── shadows.css
├── components/
│   ├── forms/
│   │   ├── Input.jsx
│   │   ├── Input.d.ts
│   │   ├── Input.prompt.md
│   │   ├── Select.jsx
│   │   ├── Checkbox.jsx
│   │   └── [others]
│   ├── feedback/
│   │   ├── Button.jsx
│   │   ├── Toast.jsx
│   │   ├── Modal.jsx
│   │   └── [others]
│   ├── content/
│   │   ├── Card.jsx
│   │   ├── Panel.jsx
│   │   ├── Grid.jsx
│   │   └── [others]
│   ├── question/
│   │   ├── OptionButton.jsx
│   │   ├── ConfidenceSelector.jsx
│   │   ├── ExplanationSection.jsx
│   │   └── [others]
│   └── ace/
│       ├── AskAcePanel.jsx
│       ├── AceThread.jsx
│       ├── AceMessage.jsx
│       └── [others]
├── ui_kits/
│   ├── learner_app/
│   │   ├── index.html
│   │   ├── Dashboard.jsx
│   │   ├── SessionBuilder.jsx
│   │   ├── QuestionScreen.jsx
│   │   ├── ProgressPage.jsx
│   │   └── [screens]
│   └── marketing_site/
│       ├── index.html
│       ├── Hero.jsx
│       ├── Features.jsx
│       ├── Pricing.jsx
│       └── [sections]
├── guidelines/
│   ├── colors.html (@dsCard)
│   ├── typography.html (@dsCard)
│   ├── spacing.html (@dsCard)
│   ├── shadows.html (@dsCard)
│   ├── buttons.html (@dsCard)
│   ├── form-fields.html (@dsCard)
│   ├── cards-panels.html (@dsCard)
│   ├── question-design.html (@dsCard)
│   ├── ace-ui.html (@dsCard)
│   └── accessibility.html (@dsCard)
├── assets/
│   ├── logo.svg (brand mark, if provided)
│   ├── favicon.svg
│   ├── illustrations/ (any provided brand illustrations)
│   └── icons/ (SVG icon set, if adopted)
└── thumbnail.html (design system tile preview)
```

## Key Decisions

1. **Single design source**: All visual tokens live in `styles.css` and its imported files. No design-tokens library dependency — direct CSS custom properties used by both Astro and Next.js frontends via a shared Tailwind config package.

2. **Component authorship**: Reusable primitives are written as React components (`.jsx` + `.d.ts` + `.prompt.md`) so they're available to both the learner app and the admin portal, and can be re-exported as a bundled library for third-party use.

3. **No pre-built templates**: The design system provides components and guidelines, not rigid templates. Consuming projects compose screens from primitives and follow the layout rules defined here.

4. **Accessibility is non-negotiable**: Every component includes ARIA, keyboard support, and `prefers-reduced-motion` fallbacks. WCAG 2.2 AA is the target; no compromise on multi-sensory feedback.

5. **Copy is sacred**: Every string in the product comes verbatim from the Website Copy document. The design system does not invent microcopy; consuming projects reference the copy document or ask rather than paraphrasing.

## Future Roadmap

- **Extended-matching questions**: Schema support exists; UI not yet shipped
- **Free-text numeric calculation entry**: Fields captured for future use; input stays multiple-choice for now
- **Dark mode**: Tokens make this a configuration change; deferred until post-launch
- **Mobile app / PWA**: Responsive design supports it; native app store distribution deferred
- **Additional simulator scenarios**: The consultation simulator ships with one scenario; more can be added via the content pipeline
- **Social login**: Explicitly out of scope; email/password + email-link authentication only

## Contact & Governance

This design system is maintained by AcePharm and versioned alongside the product. Changes to tokens, components or guidelines require sign-off from product and design leadership to ensure consistency across learner and admin surfaces.
