# Model tiers

Goal: spend Opus only where quality depends on it. Mechanical work goes to cheap project subagents in `.claude/agents/`, which use less of the usage limit and keep long output out of the main context.

## Agents

| Agent | Model | Job | Never |
|---|---|---|---|
| `ue-runner` | Haiku | Run `lint`, `test`, `tracker`, `npm run ig`, `tts`, `sfx`, `blender`, render, `master`, `qa:audio`, `cover`; return PASS/FAIL + decisive lines | Edit files, add flags, retry or fix |
| `ue-scout` | Haiku | Read-only lookups: where is X, which posts use model/world/style Y, last 3 posts' looks and styles, idea statuses | Suggest fixes |
| `ue-metrics` | Haiku | Insights CSV into `metrics:` blocks, then `npm run tracker` | Touch anything outside `metrics:`, invent numbers |
| `ue-copy` | Sonnet | Captions, comments, replies, DMs, story copy, carousel copy, repurpose ideas, with the `/ig-human` pass | Post anything, change script text or facts |

## By pipeline step

| Step | Who |
|---|---|
| Spine, topic, script, hooks (`/ig-reel`), cold read | Main session (Opus) |
| `/ig-plan`, `/ig-audit`, `/ig-viral`, `/ig-profile` | Main session (Opus) |
| `npm run ig` and recording scores | `ue-runner`, main session records |
| Caption (`/ig-caption` + `/ig-human`) | `ue-copy` |
| Carousel copy (`/ig-carousel`) | `ue-copy`; main session checks against `docs/carousels.md` |
| `tts`, `sfx`, `blender --preview`/full, `cover`, render, `master`, `qa:audio` | `ue-runner` |
| Model pick, world choice, `blender` plan, new worlds/models | Main session (Opus) |
| Scenes, `script.ts`, `Root.tsx` | Main session (needs all brand/layout rules in context) |
| Motion and edge QA (contact sheets, full-size crops) | Main session (Opus); `ue-runner` may render the sequence and sheets |
| Listening QA (`out/qa/mix.wav`) | The user |
| `lint` / `tracker` before calling work done | `ue-runner` |
| Metrics after posting | `ue-metrics` |
| Stories, comments, replies, DMs | `ue-copy` |
| Debugging anything | Main session |

## Rules

- Cold start: each agent re-reads files from scratch. Use one for tasks with long output or wide searches, not for a one-line command whose output is short; run those inline.
- Parallel only for independent jobs (e.g. `ue-copy` drafting comments for different accounts, `ue-runner` on `lint` while `ue-scout` checks recent styles). Don't run two `ue-runner` jobs that write the same `out/` or `public/` folder.
- The main session checks agent results before acting: a PASS from `ue-runner` doesn't replace the motion/edge QA, and `ue-copy` drafts still go to the user for approval.
- No Opus subagents. If a job needs Opus judgment, it belongs in the main session.
