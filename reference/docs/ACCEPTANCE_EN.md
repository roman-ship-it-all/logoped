# Acceptance checklist for the implemented game

This checklist is a handoff requirement. It does not mean the game has already been implemented or tested.

| ID | Scenario | Pass condition |
|---|---|---|
| 01 | Fresh load over static HTTP | Welcome renders without console errors, all Czech diacritics intact |
| 02 | JSON unavailable or malformed | Czech error and retry control; no blank screen |
| 03 | Word inventory | Exactly 60 unique IDs; every image exists; all categories/filters accessible |
| 04 | Default session | Exactly máma, táta, oko, bota, auto in stable dataset order |
| 05 | Selection | Every word can be selected; check mark, selected count and accessible state agree |
| 06 | Too few / too many | Start disabled with 0–4; sixth word refused with neutral feedback; deselection works |
| 07 | Card loop | One word at a time; replay/skip/next available as appropriate; no timed progression |
| 08 | Finish | Five resolved cards produce completion with exactly five flowers |
| 09 | Skip | Resolves exactly one card with equal garden growth, no negative feedback |
| 10 | Rapid Next/Skip | Double click / rapid mixed input cannot jump over a card or exceed index bounds |
| 11 | Restart | Index, transition locks, audio state and garden reset; selection remains |
| 12 | Pause and exit | Stops audio, traps/restores focus, resumes current card or exits cleanly |
| 13 | Missing recordings | No requests for not-recorded clips; honest adult-led UI; no microphone prompt |
| 14 | Ready clip | Explicitly marked ready clip can play after gesture; replay restarts, never stacks |
| 15 | Audio race | Play then rapidly next/replay/exit; old events cannot affect current card |
| 16 | Audio failures | 404, decode error and rejected play promise trigger operable adult-led fallback |
| 17 | Mute and hidden tab | Current audio stops; unmute/return does not unexpectedly autoplay |
| 18 | Persistence | Selected IDs and sound/motion settings survive refresh; no personal/session history |
| 19 | Storage errors | Invalid JSON, obsolete IDs, duplicates and throwing storage access recover safely |
| 20 | Missing image | Czech word and fallback shown; navigation remains usable |
| 21 | Layout | At 360×640, 390×844, 768×1024, 1440×900: no overlap, horizontal overflow or hidden actions |
| 22 | Input | Touch and keyboard operate all flows; focus visible; dialogs keyboard-usable |
| 23 | Motion | Reduced motion renders final states immediately; no progression depends on animation |
| 24 | Privacy | No recorder/microphone, analytics, external API, cloud TTS, tracking or runtime AI |
| 25 | Package | ZIP opens; README, complete source, JSON and runtime assets included; no secrets/caches |

Record browser/version and actual PASS/FAIL/NOT TESTED evidence. For audio control tests use a temporary local clip if no reviewed Czech recordings exist; passing controller tests does not certify pronunciation. Conduct a separate Czech native-speaker review before marking audio ready. A supervised usability review should check picture recognition, pace and whether the child finds the activity comfortable. Do not collect names or voice recordings for that review.
