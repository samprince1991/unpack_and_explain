# Sound effects pipeline

Status: design approved 2026-11-08. Sound generation waits for the paid ElevenLabs plan (see Rollout).

## Goal

Add sound design to reels using ElevenLabs sound effects: a small shared set of motion sounds that keeps reels on brand, plus 1-3 topic sounds per reel that make each one sound different. Sounds stay sparse and never compete with the voice-over.

Today the template plays only `pop` (frame 0) and `chime` (congrats card). The section-change whoosh was removed after review because it landed on the end of every voice line. That decision stands.

## Decisions

| Question | Decision |
|---|---|
| What sounds | Shared set + per-reel topic sounds. No ambient beds |
| Placement | Written by hand per reel in `script.ts`, timed to spoken words. Nothing plays automatically from Blender beats |
| Reels | Unposted (10, 12, 26) and new (idea 04 onward). Live posts (01, 02, 03, 20) opt out |
| Architecture | Data in `script.ts`, one pure resolver, played by `Reel.tsx`. Rejected: sounds inside scenes (reel-wide limits can't be checked), adding sounds with ffmpeg after rendering (no Studio preview) |

## Sounds

### Shared set

Added to `sfx` in `src/brand/audio.ts`, generated once by `npm run brand-audio`, listed in `library.json`. Prompts and volumes below are starting points, tuned by ear on post 26.

| Name | Use | Starting prompt idea |
|---|---|---|
| `tick` | A number or label appears | Short soft mechanical tick, clean |
| `thud` | Parts land or lock, an impact | Soft low thud, short, no reverb tail |
| `swell` | Build into a key reveal (use a negative offset) | Short airy rising swell, gentle, no impact |
| `sweep` | Something travels (a signal, a dot) | Soft airy sweep, light, short |
| `snap` | Something clicks into place, a result | Crisp soft snap, clean |
| `stamp` | MYTH / FACT stamps | Soft rubber stamp on paper, muted |
| `buzz` | Failure moment in F posts | Short low error buzz, muted, not harsh |

`pop` and `chime` are unchanged and stay template-placed.

### Topic sounds

Declared per post in `script.ts`. `npm run sfx -- post-NN-slug` generates them into `public/posts/post-NN-slug/sfx/<name>.mp3` and writes `public/posts/post-NN-slug/sfx/sfx.json`, recording each sound's prompt, seconds, model and file. Existing files whose entry matches are kept; `--only=name --force` regenerates one sound. Needs `ELEVENLABS_API_KEY`, like `npm run tts`.

### Generation

- Endpoint `POST /v1/sound-generation`, `output_format=mp3_44100_128`, `prompt_influence: 0.6` (as `brand-audio.ts` does today).
- API limits: `duration_seconds` from 0.5 to 30.
- Model pinned in one constant in `brand/audio.ts`: `eleven_text_to_sound_v2`. `eleven_text_to_sound_v3` is limited access (other accounts get `Unknown model`), so moving to it is a later, deliberate change.
- `scripts/lib/sfxEdges.ts` post-processes every newly generated sound: level-match to a common peak, trim silence off both ends so cues land on the word, add short fades so nothing clicks. This runs on raw samples in TypeScript, because Remotion's bundled ffmpeg has no `afade`, `areverse`, `silenceremove` or `volumedetect`; ffmpeg only decodes and encodes. Applied to new or forced sounds only, so `pop` and `chime` stay untouched unless `--force` is used.

## Script format

New required field on `PostScript`:

```ts
sfx: SfxPlan | { optOut: string };

type SfxPlan = {
  custom?: Record<string, { prompt: string; seconds: number; volume?: number }>;
  cues: {
    sound: SfxName | string;   // shared name or a key of custom
    section: "hook" | "setup" | "mechanism" | "payoff";
    cue: string;               // spoken word in that section
    offsetFrames?: number;     // -15 to 15, default 0
  }[];
};
```

`script.ts` is the only source of truth. `idea.md` and the tracker don't change.

## Timing and playback

`src/templates/sfxCues.ts` exports a pure `resolveSfxCues(plan, voSections, timings, fps)`:

- Frame = section `from` + cue word frame (`findCueMs`, same matching as `useCue`, so the first occurrence wins) + `offsetFrames`, clamped to the section.
- Sound length is capped at the end of its section, with a short fade, so nothing runs across a transition.
- Cue word not found: throws. `validateScript` already guarantees it is spoken, so this means the script and VO have diverged.
- Fewer than 1 s between two cues: throws in final renders, logged in Studio. This needs VO timing, so it can't live in `validateScript`.

`Reel.tsx` plays resolved cues next to the existing `audioCues` loop. `calculateReelMetadata` loads `sfx.json` for posts with a plan.

Missing or stale files (`sfx.json` doesn't match the plan, or a shared sound is absent from `library.json`): a final render throws; Studio plays without them.

SFX aren't part of the Blender plan or VO timing, so adding them doesn't make Blender clips stale.

## Rules in `validateScript`

Errors unless noted. Limits are starting values, tuned on post 26.

- `optOut` needs a reason.
- At least 1 cue (otherwise use `optOut`), at most 8 per reel and 4 in the mechanism.
- At most 3 `custom` sounds, each 0.5-4 s. A `custom` name can't shadow a shared name. Unused `custom` sound: warning.
- Cues only in hook, setup, mechanism or payoff (enforced by the type and at runtime).
- `sound` exists and isn't `pop` or `chime`, which stay template-placed. `cue` is spoken in that section.
- The cue's first occurrence can't be the section's last word: that's what made the whoosh sound wrong.
- `offsetFrames` within -15 to 15.
- `custom` prompts can't ask for speech or music (word check: voice, speech, spoken, singing, vocal, music, melody, song). Copyright rule: only generated sound effects.

## QA

`ReelProps` gains `audioMix?: "full" | "vo" | "sfx"` (default `"full"`; `mix` is already the transition map in `Reel.tsx`). `"vo"` plays only voice-over, `"sfx"` only effects. Music is muted in both stems.

`npm run qa:audio -- post-NN-slug` renders both stems, then:

1. **Stutter check:** runs `scripts/audio-bursts.py` on the voice stem. It looks for short sounds with silence on both sides, so on the full mix an intentional tick in a pause would fail and a sustained topic sound could hide a real VO stutter. Must print "No stray blips".
2. **Level check:** new `scripts/audio-sfx-levels.py`, given the resolved cue windows as JSON. Fails if any cue comes within about 8 dB of the voice (RMS) where the two overlap. Starting threshold, tuned on post 26.

This replaces the three-step QA audio commands. Someone still has to listen to the full mix across every section boundary and every cue, because a script can't judge whether a sound fits. `npm run master` is unchanged.

## Testing

- `sfxCues.test.ts`: frame calculation, offset and clamping, capping at section end, cue not found, gap too small.
- `validate.test.ts`: every rule above, plus `optOut`.
- `audioCues.test.ts`: unchanged, confirming `pop`, `chime` and no section-change sounds.
- `sfxEdges` sample processing and the `sfx.json` staleness comparison as pure functions.
- `script.test.ts` in each post keeps asserting no errors or warnings.
- `audio-sfx-levels.py` checked on a post 26 render, including a deliberately over-loud cue to prove it fails.

## Rollout

**Phase 1, code and docs (no ElevenLabs credits, can start now).** Types, resolver, validation, generator scripts, `audioMix` prop, `qa:audio`, tests, and the `CLAUDE.md` update: commands, Audio section (including the licensing wording), per-post workflow step 3c "plan and generate SFX", QA checklist. All seven existing posts get `optOut`: 01, 02, 03 and 20 with "posted before SFX", 10, 12 and 26 with "SFX planned, awaiting paid-plan generation". Nothing changes in any render. New posts must have a plan; a reel with a plan can't do a final render until its sounds exist.

**Phase 2, sounds (after the paid plan is active).**

1. Confirm the plan is active, then generate the seven new shared sounds.
2. Write post 26's plan, generate, render, run `qa:audio`. The user listens and approves or adjusts prompts, volumes and limits.
3. Apply the tuning, repeat for posts 10 and 12. Re-render and master all three.

## Paid-plan effects to decide at Phase 2

Content made on the free plan never gains commercial rights, so upgrading raises three questions. None of them block Phase 1.

- **`npm run brand-audio` will also generate the music bed.** The script tries music whenever the file is missing and today fails on the free tier. Once it succeeds, `library.music` is set and **every later render gets music**. So Phase 1 makes music opt-in: `npm run brand-audio` only generates the bed with `--music`, and an existing bed stays in use. `CLAUDE.md` already specifies the bed at about -20 dB, so the remaining decision is when to generate it.
- **`pop` and `chime` were made on the free plan.** Regenerating them (`--force`) changes the brand sound slightly for all re-renders.
- **VO on 10, 12 and 26 was made on the free plan.** `CLAUDE.md` says to regenerate VO under the paid license before monetizing. New takes change timing, which makes Blender clips stale and means full `npm run blender` runs. If that's wanted, do it **before** writing their SFX plans, or the cue checks and mix get redone.

Live posts (01, 02, 03, 20) keep their free-plan audio. Changing that is a separate decision.

## Out of scope

Ambient beds, automatic beat-to-sound mapping, sounds on section changes, carousels (silent), multi-take audition tooling, per-post music.
