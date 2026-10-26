# Audio clips (none shipped)

No Czech recordings are included. Every entry in `data/words.json` is `audioStatus: "not-recorded"`,
so the game runs in **adult-led mode**: the card shows „Slovíčko přečte dospělý.“ and no replay button.
The game never requests a clip for a `not-recorded` entry.

## Adding a reviewed clip

1. Record per `reference/audio-script.json` and `reference/docs/AUDIO_EN.md` (the bare word only, mono MP3, 96–128 kbps).
2. Save it as `audio/words/{id}.mp3`, e.g. `audio/words/mama.mp3`. The path must match the entry's `audio` field.
3. After a Czech native-speaker review, set that entry's `audioStatus` to `"ready"` in `data/words.json`. Change one entry at a time; mixed availability is supported.
4. Reload over the static server. The card for that word now shows „Poslechnout znovu“, plays once when the card appears (after the Start / Dál / Přeskočit gesture) and can be replayed without limit.

If a `ready` clip 404s, fails to decode or the browser rejects playback, the card falls back to
„Nahrávka není dostupná. Slovíčko přečte dospělý.“ for that word and the session stays fully usable.
Quick check for a ready path: `curl -I http://127.0.0.1:8000/audio/words/mama.mp3` should return 200.
