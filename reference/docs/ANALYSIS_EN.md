# Product and educational analysis

## Intended outcome

A calm browser activity for Czech-speaking children approximately 3–6, accompanied by an adult. A child sees one familiar picture, hears one Czech word, and may imitate it. The game recognizes button actions only; it never claims to know whether the child spoke or pronounced a word correctly. It is a practice activity, not a diagnostic or therapy system.

## Why this game loop

One picture reduces competing visual choices during repetition. A session of five cards is a deliberately small design default, not a clinical duration prescription. Unlimited replay and manual advance let the adult pace the activity. A garden grows after visiting a card; growth represents shared participation, not correct speech. Skipping receives the same gentle transition, preventing the reward from pressuring a child to speak.

Core loop: choose five unique words → see a picture → hear an adult or recording → optional repetition → replay / skip / continue → five flowers → replay or finish. There is no speech-driven branching.

## Vocabulary strategy

60 entries across people/gestures (6), animals (10), food/drink (10), everyday objects and transport (10), body (8), nature (8), and home/toys (8). The JSON is the authoritative list. Default session: máma, táta, oko, bota, auto. Ten entries carry `starter:true` to offer an initial selection pool; this is an editorial convenience, not a phonetic hierarchy.

Familiarity, word length and articulation demands are different dimensions. A familiar word such as strom or lžíce can contain a challenging sound sequence. Do not market the entire set as equally easy or sort it into unvalidated clinical levels. An adult can replace any default word before play.

Include singular target labels consistently; natural synonyms are not errors. If a child says květina instead of květ, an adult may acknowledge the meaning and model the selected word. Do not use the game to suppress a child's valid vocabulary.

People illustrations depict generic family roles and need adult explanation. A picture cannot establish who a child's mother or grandfather is. Bába is optional and may be omitted if the family uses babička. Pápá represents a gesture, while ruka names a body part: similar visual material needs different adult modeling. Water as a drop and milk as a carton also require a quick meaning check. These caveats are attached to entries as `adultNote`.

## Interaction and inclusion

Czech speech and pictures carry the activity; reading is optional. Labels help the adult. Use real buttons with visible keyboard focus and a minimum 56px touch area. Color is never the only indication of selection. Show both a check mark and a selected count. Use one main action and a quieter skip action. No countdown, forced response, failure sound, red error state for pronunciation, ranking or lost rewards.

Permit exit at all times. If audio is unavailable, keep the game operable with the accompanying adult. A pause freezes progression and stops audio; it does not measure a child's silence. Let adults turn motion off in addition to following the system preference.

## Art direction decision

Chosen direction: an illustrated meadow with a cream background, teal interface, round outlines and a small cream rabbit wearing one teal scarf. Alternatives considered: photo cards (realistic but require sourced consistent images and licensing work) and emoji (cheap but platform-dependent and semantically inconsistent). Editable SVG pictograms provide fixed silhouettes, tiny files and consistent rendering across all 60 words.

The main object receives the largest clear region. The mascot stays outside that region. No decorative scenery is placed behind the word picture. The three mascot poses are illustrations, not an articulation model or a lip-sync system. No animated mouth positions are required.

## MVP and tradeoffs

Build with vanilla HTML/CSS/JavaScript, local JSON and supplied SVG files. No bundler, framework or installation is needed. Local storage contains only selected IDs and sound/motion settings. No session history, personal data or speech is stored. The game does not call Claude or any AI service at runtime.

The largest remaining dependency is Czech speech audio. The kit supplies a complete recording script and fixed filenames, but not recordings. Ship the first budget-constrained build in clearly labeled adult-led mode, then add reviewed native-speaker clips without changing code. Browser speech synthesis is excluded from the default scope because a suitable Czech voice may not be installed and pronunciation quality would vary. This avoids silently substituting an unsuitable voice.

## Risks and next checks

| Risk | Design response | Evidence still required |
|---|---|---|
| Picture interpreted differently | Adult note, one object per card, editable source | Short review with an adult and several intended users |
| Pressure to repeat | Manual pace, optional speech, equal skip behavior | Observe a supervised session |
| Missing or overlapping audio | Adult-led fallback, one audio controller, cancel on transition | Browser integration tests |
| Small-budget scope expansion | Fixed five-card loop, reusable supplied assets, no services | Metered implementation run |
| Unclear pronunciation outcome | No scoring or clinical claims | Review final wording and UI |
| Accidental storage failure | Safe localStorage wrappers; in-memory fallback | Private-mode and malformed-data tests |

No pilot with children, clinical assessment or final app browser test has been performed in this design handoff. The acceptance checklist distinguishes these from asset validation.
