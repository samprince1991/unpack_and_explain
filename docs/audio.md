# Audio and captions

## Voice-over

- ElevenLabs voice `ktkP7Nsj67dw2zcplQYt` (replaced premade Brian on 2026-11-10; posts voiced before then still use Brian), set in `src/brand/voice.ts`. Never switch voice or settings per post. Changing it means re-running `npm run tts` for every post you want to re-render.
- **Tone: upbeat and warm, never flat.** The settings (stability 0.35, style 0.45) give an energetic read. Scripts help with punctuation: "?" on the question, short sentences, and **no "!"** (it over-emphasizes the word before it). If a line sounds flat, rephrase or re-run TTS for that post; don't change the settings per post.
- The API key is restricted (no `voices_read` / `user_read`), so voices can't be listed from here. Get voice IDs from the ElevenLabs website.
- VO is generated per section with timestamps by `scripts/tts.ts`. Section length = real audio length + tail pad. The script's "Time" column is guidance only.

### Stitching bleed

`tts.ts` sends `previous_text` / `next_text` so sections sound continuous, but sometimes the first sound of the *next* section leaks onto the end of a file, after the final silence. In the reel it plays about 0.6 s before the next section's real first word and sounds like a stutter ("E... Each", "...Follow").

`scripts/lib/voClean.ts` detects a burst under 300 ms after a silent gap (only after the last word's start, so a real short last word is never cut), cuts it inside the silence and fixes `vo.json`. Never bypass this step, never hand-edit VO mp3s, and never "fix" a stutter by moving sections around: run `npm run vo:clean`, then the QA audio check.

## Licensing

The paid ElevenLabs plan has been active since 2026-11-08, so generating VO and sounds is allowed. Per ElevenLabs' docs, free-plan output can't be used commercially, must include "elevenlabs.io" in the title when published, and never gains commercial rights later, even after upgrading. Paid-plan output is commercial, except beta services.

**Before monetizing, running ads or doing brand deals,** regenerate everything made before that date (older VO, `pop`, `chime`), so every published file was made under the paid plan. New VO takes change timing, so those posts also need `npm run blender` again.

Copyright: only ElevenLabs-generated audio or audio we synthesize. No downloaded tracks, no commercial songs.

API keys live in `video/.env`. Never commit `.env` or print keys.

## Captions

- JSON in the `Caption` type from `@remotion/captions`, built from TTS timestamps.
- Pages and line breaks come from `templates/captionPages.ts` (phrase-aware, not time-based): a new page at every sentence end, section end and pause; long sentences split at commas or before link words; at most 2 balanced lines per page; no breaks after weak words ("make me a" / "habit tracker"), no quote split across pages, no orphan words.
- Widths use a glyph estimate calibrated to Inter SemiBold 64 px (`LINE_CHARS`); re-calibrate if the caption font or size changes.
- Don't go back to `createTikTokStyleCaptions` or CSS `text-wrap`.
- Use `<Audio>` from `@remotion/media`.

## Brand sounds (`src/brand/audio.ts`)

- `pop` (logo sting, frame 0) and `chime` (congrats card) are placed by the template (`templates/audioCues.ts`).
- **No sound on section changes.**
- Generated once with `npm run brand-audio` into `public/brand/audio/` + `library.json`. Existing files are kept so every reel sounds the same; `--force` regenerates, which changes the brand sound for all re-renders.
- **Music bed:** one instrumental (volume 0.1, about 20 dB under VO, 1 s fade in and out). It's opt-in with `--music` because once it exists every later render plays it, so the user decides before it's made. Posts don't add their own music.

## Sound effects per reel

Every new reel has `sfx` in `script.ts`, placed by hand and timed to spoken words like Blender beats. Posts without sounds opt out with a reason, and `src/brand/sfxPosts.test.ts` lists who may.

Shared sounds:

| Sound | Use |
|---|---|
| `tick` | A number or label appears |
| `thud` | Parts land or lock |
| `swell` | Builds into a reveal; use a negative `offsetFrames` |
| `sweep` | Something travels |
| `snap` | Something clicks into place |
| `stamp` | MYTH / FACT |
| `buzz` | A failure moment |

Topic sounds go in `custom`, with a prompt that suits the subject and differs from the last post's:

```ts
sfx: {
  custom: { spoolup: { prompt: "jet engine spooling up", seconds: 3 } },
  cues: [
    { sound: "spoolup", section: "hook", cue: "engine" },
    { sound: "thud", section: "mechanism", cue: "compress", offsetFrames: -2 },
  ],
},
```

**`validateScript` enforces:**

- At most 8 cues per reel and 4 in the mechanism.
- At most 3 topic sounds, 0.5-4 s each, with no speech or music in the prompt.
- Cues only in the hook, setup, mechanism or payoff.
- The cue word is spoken there and isn't the section's last word.
- `offsetFrames` from -15 to 15.

Cues under 1 s apart, or missing or stale sounds, make a final render throw and only warn in Studio. Long sounds fade out and stop at their section's end. Generated sounds are cleaned in `scripts/lib/sfxEdges.ts` (common peak, silence trimmed, short fades). Adding or changing sounds never needs a Blender re-render.
