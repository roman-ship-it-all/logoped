# Say It with Kiki — developer handoff

This is a complete **design, content and graphical asset kit**, not an implemented game. The UI previews are static. No voice recordings are included. The next step is to build the game from this kit using PROMPT_EN.md.

## Start here

1. Open `../REVIEW.html` locally to inspect all seven design sheets.
2. Read `ANALYSIS_EN.md`, then `SPEC_EN.md` and `ACCEPTANCE_EN.md`.
3. Use `../data/words.json` and `../data/ui.cs.json` as the content source.
4. Reuse `../assets/` directly; do not ask an AI to recreate the pictures.
5. Give the coding agent `../PROMPT_EN.md` together with the extracted kit.

## Included

- 60 distinct vocabulary entries in seven categories; every entry has a matching SVG.
- 81 SVG production assets: 60 word pictures, 14 UI symbols, 3 Kiki poses, 3 flower stages, 1 meadow background.
- 60 transparent 256px PNG word exports for systems that cannot use SVG.
- Seven editable SVG design sheets and rendered PNG previews: welcome, adult selection, gameplay desktop/mobile, completion, style board, vocabulary sheet.
- CSS tokens and button states; English pedagogical/product analysis, technical spec, budget plan, audio recording script, test checklist, visual profile and asset manifest.
- Reproducible Python source generators. Generated SVGs are also fully editable without those generators.

## Running the review

Double-click REVIEW.html. It has no JavaScript, external resources, build step, or game functionality. The future game should run over a local/static HTTP server because it loads JSON. Example: `python3 -m http.server 8000` from the game's root.

## Boundaries

The 60-word set extends beyond the easiest words. Category and starter labels describe content, not clinical difficulty or recommended treatment order. An adult chooses appropriate targets. Recognition by real children and Czech audio quality still need a user review. All speech audio paths are planned, not delivered recordings. No automatic speech recognition, microphone use, accounts, runtime AI, backend, or purchases are planned.

## Budget

USD 8 is the user's maximum for subsequent Claude implementation, not a price guarantee or payment already made. Set a spending limit in the calling tool/provider; text instructions alone cannot enforce it. See BUDGET_EN.md. This kit makes no API calls.

## Ownership and reuse

The vector drawings and project-specific text were created for this handoff; no stock images, downloaded fonts or third-party character assets are included. You may use, modify and redistribute these deliverables in the game. System fonts are referenced, not bundled. No trademark clearance or clinical validation is claimed.
