# Implementation specification — version 1.0

## Goal and delivery

Build “Řekni to s Kiki”, a small static browser game using this asset kit. Deliver complete runnable source, a README, actual verification results and a ZIP. All child-facing text must be Czech; code comments and documentation may be English. Reuse existing illustrations exactly. The package's review HTML is a visual reference only.

## Architecture

Use index.html, styles.css, app.js, data/words.json, data/ui.cs.json and assets/. No dependencies, build tool, backend, login, analytics, paid service, runtime AI or microphone APIs. Use semantic HTML controls rather than a canvas for menus. Load JSON once on startup; validate unique IDs and required fields. Handle loading errors with a Czech message and a retry button. Render text using textContent.

Suggested modules/functions within app.js: loadContent, readSettings, writeSettings, renderScreen, selectWord, startSession, renderCard, playWord, stopAudio, advance, finishSession. Avoid a large component or entity framework. Treat file paths as data from the shipped JSON only.

## Data contract

Each word has id, text, category, image, audio, audioStatus, prompt, starter, adultNote. `audioStatus: "not-recorded"` means the clip is intentionally absent. Do not request that clip on page load. When files are supplied and reviewed later, change audioStatus to `ready`. File path pattern: audio/words/{id}.mp3. Never infer availability from the existence of a path string.

Use supplied `data/defaults.json` for default selection. Keep the selected IDs unique and present in the current dataset. If persisted values are invalid, recover to defaults. Store only selectedIds, soundEnabled, motionEnabled with a schema version. Catch JSON parsing and localStorage errors. Adult notes never appear as instructional text to a child.

## Screens

1. Welcome: title, Kiki welcome pose, “Začít”, “Vybrat slovíčka”, sound state and brief adult-led audio notice when relevant. Start uses the current valid selection.
2. Adult selection: seven category filters plus all/starter filter; 60 picture cards with checkbox semantics, selected count and visible check mark; select exactly five. A sixth selection is refused with a neutral Czech notice. Deselect remains possible. Start is disabled until exactly five are selected. Provide reset-to-defaults. No passwords or fake security gate.
3. Play: one large picture, optional visible word label, ordinal “Slovíčko 2 z 5”, replay or adult-led instruction, Kiki listening pose, “Dál”, “Přeskočit”, pause/sound/exit controls. Never show all word cards during imitation.
4. Pause/exit confirmation: audio stops; allow resume, return to welcome, or return to selection. Put focus inside the dialog; Escape resumes; restore focus when closed.
5. Completion: five flowers, Kiki happy pose, “Děkuju za společné hraní.”, “Hrát znovu”, “Hotovo”. Restart resets the index and garden while preserving the selection. Done returns to welcome and stops audio.

## State and transitions

WELCOME → SELECT or PLAY → PAUSED → PLAY; PLAY → COMPLETE on the fifth resolved card; COMPLETE → PLAY or WELCOME. SELECT → WELCOME or PLAY. Maintain screen, selectedIds, sessionIds, index (0–4), resolvedCount (0–5), transitionLock, audioGeneration and settings. Session order follows the stable dataset order for selected words. No randomization is required.

Start snapshots exactly five unique selected IDs. Any successful Next or Skip resolves one card and increments index once. Both actions grow one flower to avoid making rewards depend on speech. Keep Skip in a secondary visual style. Disable advance controls briefly during the 200ms card transition and ignore duplicate events; cancel the old transition on exit/restart. Do not auto-advance when audio ends. No timeout waits for speech. The child can continue before hearing the full clip; transition cancels it.

## Audio controller

Begin sound only after an explicit user gesture. On a new card, attempt a ready word clip; the clip contains only the target word. Display the prompt as live text. Do not overlay a spoken UI prompt. Replay restarts the current word, never queues another copy. Before playing, advancing, skipping, pausing, muting, finishing or leaving: stop/reset the active audio, increment a generation token and cancel any stale callback. Handle rejected play promises, load error and tab visibility changes. A hidden tab stops audio; return does not autoplay until the next user gesture.

For `not-recorded`, muted sound, failed playback or missing audio: show “Slovíčko přečte dospělý.” plus the target label; replace replay with an explanatory disabled control or omit it. Do not display a working speaker button that does nothing. The session stays fully operable. Never enable TTS without a separate explicit extension request. Do not fetch cloud audio.

## Visual implementation

Follow previews/game-mobile.svg and game-desktop.svg as layout references, not as background screenshots. Rebuild all interface text and controls as HTML. Source assets have no external dependencies. Use SVG word art directly; PNGs are compatibility exports. Use tokens.css, a system font supporting Czech, generous margins and one card panel. Desktop uses a mascot column and a picture column. At narrow widths stack vertically; prioritize card and controls. At short heights permit natural scrolling rather than clipping or shrinking controls below 56px. Target 360×640, 390×844, 768×1024 and 1440×900. Do not force screen orientation.

Illustration source: 512px viewBox; display 180–320px. UI icons: 64px viewBox with 24–32px display inside 56px+ buttons. If adjacent visible text already names a button, mark its icon decorative. Images receive accurate Czech alt text; avoid duplicate live announcements. Main card word is not a button.

## Feedback and motion

Participation feedback only; never “Správně”, “Špatně”, pronunciation percentages or a microphone visualization. One flower per resolved card; maximum five. Flower stages and mascot poses are static files. An optional CSS opacity/scale transition lasts 200–300ms and ends on the final pose; no loops, flashing, confetti showers or mouth animation. Use the ready final pose immediately for reduced motion. Cancel transitions on screen changes and repeated input. Functionality never depends on animationend.

## Accessibility and privacy

Set lang=cs. Keyboard operation must cover selection, replay, advance, skip and dialogs. Visible focus, real disabled states, 56px targets. Selected state uses aria-pressed or native checkboxes and a check icon, not color alone. Announce the current word and progress politely once per card without flooding a live region. No ads, links to purchases, child identification, tracking, network API calls or voice recording. localStorage failure is nonfatal. No claims of clinical validation.

## Missing assets and errors

If an image fails, display the Czech word and a neutral fallback panel, keep navigation active and report the missing path in developer diagnostics. For invalid/missing dataset, show a recoverable loading screen rather than a blank page. Do not fabricate audio files or claim assets are recorded. Keep the delivered MVP's adult-led mode obvious in README and welcome.

## Definition of done

All 60 supplied words can be selected; exactly five are used in each session; every control works; duplicate taps cannot skip cards; state resets cleanly; audio cancels correctly; no microphone permission appears; Czech text renders; layouts are usable at target dimensions; verification results are recorded honestly. See ACCEPTANCE_EN.md for scenarios.
