# Design skills installed in this project

Scraped and installed 2026-11-06 from the best-known public design-skill
sources, plus two locally curated ones. They govern how UI is designed,
built, and reviewed here. Original authors keep their licenses and
attribution; files are verbatim copies.

| Skill | Source | What it governs |
| :--- | :--- | :--- |
| `anthropic-frontend-design/SKILL.md` | [anthropics/skills](https://github.com/anthropics/skills) | Aesthetic direction: distinctive visual identity, grounding design in subject matter, the AI-tell calibration list, plan-then-review process. |
| `hallmark/SKILL.md` | [Nutlope/hallmark](https://github.com/Nutlope/hallmark) | Anti-slop floor: 16 non-waivable rules (tokens only, no `transition: all`, no eyebrows or tracked caps, no middot meta strings, hero fits 1280×800, ~80 words per screen, and more). |
| `emil-design-eng/SKILL.md` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | Design-engineering craft: when to animate at all, frequency-based rules, easings, before/after review format, the invisible details philosophy. |
| `animate/SKILL.md` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | Building an animation from scratch: correct curve, duration, properties. |
| `choreograph/SKILL.md` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | Coordinating several elements that animate together. |
| `ui-cheatsheet.md` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | One-line fixes for common UI problems (tabular nums, 65ch measure, active-state scale). |
| `performance-cheatsheet.md` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | Frame-budget rules for motion. |
| `design-taste/` | curated, local | Aesthetic judgment: anti-AI-slop detection, density, page archetypes, 11 directions. |
| `frontend-design-guidelines/` | curated, local | Mechanical correctness: a11y, states, forms, craft-and-polish layer. |

## How this project applies them

- The Hallmark floor is treated as binding: every color and font flows
  through tokens in `app/globals.css`, `overflow-x: clip` is set on the
  document, no eyebrows, no middle-dot metadata, no `transition: all`.
- Motion follows the Emil frequency framework: nothing animates on
  high-frequency actions (sliders, nav), one orchestrated entrance per
  page, user-triggered motion communicates a state change.
- Aesthetic direction follows `anthropic-frontend-design`: the design is
  grounded in the subject (a clearing-layer risk engine), reviewed
  against its AI-tell list, and its plan lives in `brand.md`.
