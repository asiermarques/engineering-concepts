# Design

Direction: **retro console "level select"**. Reading comes first: hyperlegible typography, a calm reading column and high contrast. The game feel lives in the *chrome*: pixel type in headings, hard offset shadows, HUD-style counters, A/B/C keys and a concept map.

Everything is in `src/styles/global.css`, with tokens on `:root` (light "cartridge" theme) and `prefers-color-scheme: dark` ("night console" theme).

## Typography

Self-hosted fonts via `@fontsource-variable/*` (no Google Fonts, per the privacy rule in PRODUCT.md).

| Token | Font | Use |
| --- | --- | --- |
| `--font-body` | Atkinson Hyperlegible Next | Body text, question prompts, explanations, small uppercase labels |
| `--font-mono` | Atkinson Hyperlegible Mono | Code, **all numbers** (Concept 04/13, Result, Static walkthrough steps) and A/B/C keys |
| `--font-display` | Pixelify Sans | Only `h1`/`h2`, buttons, logo and locale switcher, **always in mixed case** |

Rule: Pixelify Sans is not used for digits, single letters or uppercase text: there `B`/`8`, `C`/`O`, `2`/`8` and `5`/`S` get confused.

## Color

- `--color-accent` (coin yellow): primary action, current concept, Result. Text on top uses `--color-on-accent`; as a text color on the background use `--color-accent-ink`.
- `--color-link` / `--color-focus`: links and focus (3 px outline).
- `--color-ok`, `--color-bad`, `--color-warn` (+ `-bg`): correct, incorrect, correct option not selected. Always paired with an icon and text, never color alone.
- `--color-screen` / `--color-on-screen`: dark Result panel in both themes.

## Components

- **Panels**: 2 px border and `--shadow-hard` (offset by `--px`, no blur). Square corners.
- **Buttons**: yellow with a hard shadow; when pressed they "sink" (`translate` + zero shadow).
- **Topic cards** (`.topic-card`): home page with one "cartridge" per topic (yellow stripe, slot number in mono, number of concepts); the whole card is the link.
- **Topic map** (`.stage-map`): numbered concepts on a dotted rail; the whole card is the link.
- **Concept HUD** (`.hud`): position `04/13` and a segmented bar showing position, not progress.
- **Assessment**: area with a diagonal hatch; segmented bar of answered questions (green/red), "Question n/N" label, A/B/C keys for single-answer questions and pixel checkboxes for multi-answer ones; final panel with the Result and decorative stars.
- **Static walkthrough**: "replay"-style table with steps numbered in mono.

## Motion

Staggered entrances on the home page and the map, a `stamp` on the verdict and the Result, a shake on the incorrect option. All disabled under `prefers-reduced-motion`.

## Pending for gamification

XP, levels, streaks and achievements should reuse these patterns: numbers in `--font-mono`, rewards in `--color-accent` and hard-shadow panels. Concept status can be painted on the map number (`.stage__num`) and on the HUD segments.
