# Architecture

## Overview

A **static** site generated with **Astro** and deployed on **Netlify**. Content (concepts and challenges) lives as files in the repository and is validated at build time. Interactivity (challenges, simulators, progress, gamification) is implemented as **React islands** that hydrate only where needed. **There is no backend**: all of the learner's state is stored in their browser.

```
repo (MDX/YAML)  ──build──▶  static HTML + React islands  ──▶  Netlify CDN
                                                     │
                                                     ▼
                                     browser: local storage (progress)
```

## Key decisions

| Decision | Choice | Reason |
| --- | --- | --- |
| Framework | Astro + `@astrojs/react` + `@astrojs/mdx` | Content site with little JS; islands only for interactive parts; SEO for a public site. |
| Language | Strict TypeScript | Typed content and progress schemas. |
| Content | Astro content collections (`glob` loader) with Zod schemas | Adding content = adding files; the build fails if a concept or challenge is malformed. |
| Learner state | Browser storage | No accounts or backend (see PRODUCT.md). |
| i18n | Per-locale routes (`/es/…`, `/en/…`) with Astro's i18n | Spanish and English from the first version. |
| Hosting | Netlify, production deploy on every push to `main` | Free for this usage; no per-branch previews (see Workflow). |
| Workflow | Trunk-based: small commits directly on `main` | Real continuous integration, no long-lived branches or merges. |

## Code organisation

Feature-oriented structure (vertical slices): each feature groups its components, logic and tests.

```
src/
  content.config.ts        # collection definitions and Zod schemas
  content/
    topics/<locale>/<topic>.md                  # topic introduction
    concepts/<locale>/<topic>/<concept>.mdx
    challenges/<locale>/<concept>.yaml          # { concept, challenges: [...] }
  features/
    concept-reading/       # layout, topic/concept pages, previous/next navigation, concept schema
    challenges/            # schema, grading, state and UI (React island) of the Assessment
    content-validation/    # cross-file rules (translations, minimum challenges) and validated loading
    simulators/            # Static walkthrough (StaticWalkthrough.astro); React simulators in the future
    progress/              # progress.ts (pure model: status, results, versioned parse/migrate), store.ts
                           # (the only storage access), browser.ts (shared store), paint.ts (map/card DOM),
                           # ProgressPanel.tsx (reset/export/import island)
    gamification/          # XP, levels, streaks, achievements, spaced review (pure logic, pending)
  i18n/ui.ts               # UI strings per locale and locale utilities
  pages/index.astro        # `/` serves the home page (topic cards) in English
  pages/[locale]/index.astro
  pages/[locale]/topics/[topic].astro
  pages/[locale]/concepts/[id].astro
tests/e2e/                 # Playwright
scripts/serve-dist.mjs     # static server for dist/ used by e2e
```

URLs are `/` (English home page), `/<locale>/` (home page: one card per topic), `/<locale>/topics/<topic>/` (topic introduction and map) and `/<locale>/concepts/<id>/`, where `<topic>` and `<id>` are stable ids, identical in every locale. They are built with `src/features/concept-reading/paths.ts`.

## Content model

- **Topic** → ordered list of **concepts**.
- **Concept**: MDX with frontmatter (stable id, title, topic, order, difficulty level, prerequisite concepts, summary). It can embed simulators as components.
- **Challenge**: data (YAML or frontmatter) with a stable id, the concept it belongs to, the type and its type-specific data; it always includes an explanation of the answer.
- Concept and challenge ids are **stable and identical in every locale**: progress is stored by id and must not break when editing text or switching locale.
- A concept, challenge or topic without a translation **breaks the build** (requirement 001, BR-001).
- A concept's challenges live in a single file `challenges/<locale>/<concept>.yaml`, with a schema discriminated by `type` (today only `multiple-choice`). Whether a question accepts several options is inferred from the number of correct options.
- Each option has a stable id identical in every locale, so the build checks that the correct option matches across locales.

### Build-time validation

1. **Per file**: Zod schemas of the collections (required `learning objective`, at least one correct option, explanation per option…).
2. **Cross-file**: `features/content-validation/validateContent.ts` (pure function) checks translations, a minimum of 3 challenges per concept, duplicate ids, references to non-existent concepts and option consistency across locales. `loadContent.ts` runs it from the pages and throws a single error listing **all** violations.

## Browser state

- A single module (`features/progress`) encapsulates reads and writes; the rest of the code does not access storage directly.
- Storage key `engineering-concepts:progress`; JSON `{ version, concepts: { [conceptId]: { answers: { [challengeId]: optionIds[] }, last, best } } }`. Stored state carries a **schema version number** and migrations (`migrations` in `progress.ts`, N → N+1; version 1 is the first), so the gamification model can evolve without losing existing progress.
- If storage is unavailable or returns corrupt data, the app works with in-memory state and does not fail.
- Gamification logic (XP, levels, streaks, spaced review) consists of **pure functions** over the state, with no React or browser dependencies, so it can be tested in isolation. Dates are injected, not read from the clock inside the logic.

## Quality

- Unit tests for pure logic (gamification, challenge grading, progress migrations).
- Content validation at build time through the collection schemas.
- End-to-end tests of the main flows (reading a concept, completing a challenge, keeping progress after reload).
- Tools: **Vitest** (pure logic and React components with Testing Library + jsdom, `*.test.ts(x)` files next to the code) and **Playwright** (`tests/e2e`, against `dist/` served by `scripts/serve-dist.mjs`, because `astro preview` detaches to the background and cannot be supervised by Playwright).
- Commands: `npm test`, `npm run test:e2e`, `npm run build`, `npm run verify` (tests + build, before every push).
- The **Assessment** is a `client:only="react"` island: without JavaScript only a notice is shown (`<noscript>`).
- The **Assessment** island receives its `conceptId`, restores its state from saved **Progress** (`restoreState`, which applies the content-change rules: removed challenges ignored, answers with unknown options unanswered) and saves every change through the store (`useEffect` around the pure reducer). Last write wins between tabs.
- The topic map (`[data-concept-id]`, `.stage__status`) and the home cards (`[data-topic-concepts]`, `.topic-card__mastered`) are static HTML painted by small client scripts using `paint.ts`; without JavaScript they keep their baseline. All scripts and islands of a page share one store (`getProgressStore()`) and repaint on change.
- Storage failures (blocked, full, corrupt) degrade to in-memory state; `store.canSave()` drives the notice in the **Assessment**.

## Workflow (trunk-based)

- Work happens **directly on `main`**: no feature branches or pull requests.
- **Small, frequent** commits; each commit leaves `main` deployable.
- Before pushing: `npm run verify` (unit tests + build with content validation).
- CI (`.github/workflows/ci.yml`) runs the same on every push to `main`; if it fails, fixing it comes first.
- Netlify deploys every push to `main` to production. Unfinished work is not hidden in a branch: it is pushed in steps that don't break anything, or left unlinked from navigation until it is ready.
- To check a deploy: `E2E_BASE_URL=<url> npm run test:e2e`.

## Constraints

- No server or serverless functions; no secrets in the client.
- No third-party analytics or tracking scripts.
  - Provisionally accepted exception: on the free plan, Netlify injects its `/.netlify/scripts/hud` script into every page (owner badge and toolbar), which cannot be disabled. It is not part of the site's code. Revisit if the plan or provider changes.
- Accessibility: challenges and simulators must be usable with a keyboard and have alternative text for visuals.
- Performance: reading pages must work without JavaScript; only challenges and simulators need it.
