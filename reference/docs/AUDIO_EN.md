# Audio handoff and recording plan

## Current status

No audio recordings are supplied. All 60 word entries are marked `not-recorded`. This is a graphical/design kit; the first implementation must work in adult-led mode. The data field `audio` is a planned path, not evidence that a recording exists.

## Recording brief

A fluent Czech adult records each exact target from data/audio-script.json once, in a warm neutral voice at a natural pace. Record the word alone without the label, filename, English translation or spoken punctuation. Do not stretch consonants, insert extra vowels, overact or split the word into syllables. A supervising adult chooses whether and how to model a word for an individual child; the files do not prescribe treatment.

Capture clean mono audio with consistent microphone position and comfortable volume. Keep the word intact with approximately 100–200ms leading and 200–400ms trailing room for natural onset/offset. These are production targets, not strict timing gates. Remove clicks and excessive noise without clipping speech. Keep an uncompressed 44.1/48kHz source WAV outside the runtime; export mono MP3 around 96–128kbps. Check each clip by ear on both a phone and headphones. Aim for consistent perceived loudness; do not normalize in a way that clips the signal.

For every file, verify exact Czech label, diacritics represented in pronunciation, complete word boundaries, natural stress, no English voice, no background speech, and correct mapping to the picture. Reject unclear or inconsistent clips. No claim of professional speech-therapy approval should be made without a real reviewer.

## Integration

Store the runtime exports at `audio/words/{id}.mp3`; names contain ASCII IDs. Only after review, set that entry's audioStatus to `ready`. Mixed availability is supported. Do not flip all flags at once unless every clip has passed review. The future developer should document a simple asset check for each ready path.

The recording script includes the optional on-screen prompt for context, but only the exact `recordOnly` value should be spoken. Repeated words are played from the same file; no need for 60 spoken prompt files. Keep all UI prompts as live Czech text in this MVP. No background music or reward audio is required.

## Future additions outside the USD 8 coding scope

A professional Czech recording session, review of target appropriateness by a speech-language therapist, alternate familiar photographs for people, or speech evaluation require separate authorization and budgeting. Do not substitute automatic evaluation or an unspecified cloud voice.
