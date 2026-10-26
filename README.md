# Řekni to s Kiki („Say It with Kiki“)

A small static browser game for Czech-speaking children (about 3–6) playing together with an adult.
One picture, one Czech word, optional repetition, manual pacing, a flower per visited card. No scoring,
microphone, speech recognition, accounts, analytics, backend or external dependencies.

**Status: MVP in adult-led mode.** No voice recordings are shipped (see `audio/README.md`). The adult reads the
word; the child may repeat it. This is a practice activity, not a diagnostic or therapy tool, and has no clinical validation.

## Run

The game loads JSON with `fetch`, so serve it over HTTP (opening `index.html` from `file://` will show the Czech load error):

```bash
cd <this folder>
python3 -m http.server 8000
# open http://localhost:8000/
```

Any static server works (`npx serve`, nginx, GitHub Pages…). No build step.

## Files

| Path | Purpose |
|---|---|
| `index.html`, `styles.css`, `app.js` | The whole game (vanilla HTML/CSS/JS, `lang="cs"`) |
| `data/words.json` | 60 words: id, text, category, image, audio path, `audioStatus`, prompt, starter flag, adult note |
| `data/ui.cs.json` | Czech UI strings (`app.js` has a built-in Czech fallback if this file fails) |
| `data/defaults.json` | Default selection (máma, táta, oko, bota, auto) and default sound/motion settings |
| `assets/` | Supplied SVG artwork: 60 word pictures, Kiki poses, flowers, UI icons, meadow, `tokens.css` |
| `audio/` | Empty `audio/words/` plus instructions for adding reviewed MP3s |
| `reference/` | Design handoff docs, recording script, asset manifest and three preview PNGs (not used at runtime) |

## Screens and controls

- **Welcome** – „Začít“ starts with the current five words; „Vybrat slovíčka (Pro dospělé)“ opens the adult selection. The adult-led notice is shown here when the selected words have no ready recording.
- **Adult selection** – all 60 pictures with filters „Vše“, „První výběr“ and the seven categories. Exactly five must be selected: visible check mark, „Vybráno N z 5“, a sixth choice is refused with a neutral notice, „Obnovit výchozí výběr“ resets. „Začít“ is disabled unless exactly five are selected.
- **Play** – one picture, the word, „Slovíčko N z 5“, Kiki listening, „Teď to zkus ty.“ and the garden. „Dál“ (primary) and „Přeskočit“ (secondary) both resolve the card and grow one flower; nothing advances on a timer. For a word with `audioStatus: "ready"` the card shows „Poslechnout znovu“; otherwise „Slovíčko přečte dospělý.“ Taps during the 200 ms transition are ignored.
- **Pause / exit dialog** – „Pozastavit“, „Ukončit hru“ or Escape open it; audio stops; focus is trapped inside; Escape or „Pokračovat“ resumes the same card and restores focus; „Ukončit hru“ returns to welcome; „Vybrat slovíčka“ opens the selection.
- **Completion** – five flowers, Kiki happy, „Děkuju za společné hraní.“, „Hrát znovu“ (same five words, fresh garden) and „Hotovo“.
- **Top bar** – sound toggle (muting stops the current clip; unmuting never autoplays) and motion toggle (also honours `prefers-reduced-motion`).

Keyboard: Tab/Shift+Tab, Enter/Space on all buttons, Escape for pause/resume. All controls are real `<button>`s of at least 56 px with visible focus.

## Persistence and privacy

`localStorage` key `kiki.settings.v1` holds only `{schemaVersion, selectedIds, soundEnabled, motionEnabled}`. Invalid JSON, unknown or duplicate IDs, a wrong count, or storage that throws (private mode, blocked) all fall back to defaults and an in-memory copy. Nothing else is stored or sent anywhere; the only network requests are the game's own local files.

## Audio controller

Implemented in `app.js` (`playWord`, `stopAudio`, `audioAvailable`). One `<audio>` element at a time; a generation counter invalidates stale `ended`/`error`/promise callbacks. Audio is stopped and the generation bumped on replay, next, skip, pause, mute, exit, restart, tab hide and page hide. A clip is only started from a user gesture (Start, Dál, Přeskočit, Poslechnout znovu). Load/decode/`play()` errors mark that word as failed for the page lifetime and switch its card to adult-led text. No browser TTS, no cloud audio.

## Verification performed

Automated with Playwright in **headless Chromium 153.0.8010.12** (Linux) against `python3 -m http.server`, 30 checks, all passing on the final build. The disposable `verify.js` harness was not shipped. Covered acceptance scenarios:

| ID | Result | Evidence |
|---|---|---|
| 01 | PASS | Welcome renders, no console/page errors, diacritics intact |
| 02 | PASS | `words.json` forced to HTTP 500 → „Slovíčka se nepodařilo načíst.“ + „Zkusit znovu“; retry recovers |
| 03 | PASS | 60 unique IDs; all 60 image URLs return 200; filters show 10 animals / 10 starters / 60 all |
| 04 | PASS | Default session order `mama, tata, auto, bota, oko` (dataset order, not defaults.json order) |
| 05 | PASS | 60 cards, 5 `aria-pressed=true` with visible check marks, counter „Vybráno 5 z 5“ |
| 06 | PASS | Sixth choice refused with neutral notice, deselect works, Start disabled at 4, reset restores defaults |
| 07 | PASS | One word per card, no replay button for `not-recorded`, adult-led text present |
| 08 | PASS | Five resolved cards → completion with exactly five bloomed flowers |
| 09 | PASS | Skip resolves exactly one card and grows one flower |
| 10 | PASS | Six synchronous mixed Next/Skip clicks resolve exactly one card |
| 11 | PASS | Restart resets index, garden, lock; selection kept |
| 12 | PASS | Dialog: focus moves to „Pokračovat“, Tab wraps, Escape resumes same card, focus restored to opener; exit returns to welcome |
| 13 | PASS | No `/audio/` request is made for `not-recorded` words |
| 14 | PASS | Temporary fixture (a 1.5 s generated WAV mapped to `mama` with `audioStatus: "ready"`, injected via request interception, then deleted): plays after Start, three replays restart (generation 3→6) with one element |
| 15 | PASS | Replay then immediate Next: next card shown, old card not marked failed, no page errors |
| 16 | PASS | 404 clip, garbage body (decode error) and stubbed rejected `play()` promise each switch that card to adult-led text; navigation continues |
| 17 | PASS | Mute and simulated `visibilitychange` stop playback; unmute/return do not autoplay |
| 18 | PASS | Selection + sound setting survive reload; stored keys are exactly the four listed above |
| 19 | PASS | Invalid JSON, duplicate/obsolete IDs, and `localStorage` getter that throws → defaults, no errors |
| 20 | PASS | Picture forced to 404 → „Obrázek není dostupný.“ with the word; Next still works |
| 21 | PASS | 360×640, 390×844, 768×1024, 1440×900 on welcome/play/dialog: no horizontal overflow, every rendered button ≥ 56×56 px (screenshots reviewed by eye for 390 and 1440) |
| 22 | PASS | Keyboard: Enter on focused Start begins, Enter on Skip advances, focus outline present |
| 23 | PASS | `prefers-reduced-motion: reduce`: next card rendered synchronously, double tap swallowed, lock released after 200 ms |
| 24 | PASS | Source contains no getUserMedia / SpeechRecognition / speechSynthesis; no non-local requests |
| 25 | PASS | ZIP built from the listed files only (no caches, no fixtures) |

**Not tested:** Firefox, Safari/iOS, Android Chrome, real touch hardware, screen readers, real Czech recordings, any child or
speech-therapist review. The audio tests certify the controller logic only, not pronunciation. Treat these as open items before any real use.

## Limitations

- No recordings yet; adult-led mode is the shipped experience.
- Illustrations of people are generic roles and need adult explanation (see `adultNote` in `data/words.json`).
- Category and starter labels describe content, not clinical difficulty.
