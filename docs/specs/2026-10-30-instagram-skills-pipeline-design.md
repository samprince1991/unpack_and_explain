# Instagram skills pipeline: design

Date: 2026-10-30. Status: approved ("go ahead").

## Goal

Use all 13 skills of the `instagram-agent` plugin (github.com/Jakeschincariol/instagram-agent-skill) across the whole content process, without breaking the brand and reel rules in `CLAUDE.md`.

## Decisions

| Question | Decision |
|---|---|
| Opening question card (scored 45 WEAK on `hookscore.py` for idea 2) | Keep the card, but it must score 50+ and aim for 7 words or fewer with something concrete. No template change. |
| Where skill state lives | In the repo. `instagram/` holds `voice.md`, `swipe.md`, `engage.md`, `profile.md`. The skills' `log.md` is replaced by fields in each `idea.md`; `plan.md` is replaced by the `ideas/README.md` schedule. |
| Routines beyond reels | All of them: engagement round (`ig-comment`, `ig-reply`, `ig-dm`), stories (`ig-story`), profile audit (`ig-profile`), carousels back (`ig-carousel`, `ig-repurpose`). |
| Tracker depth | Extend it: hook fields, more metrics, carousel checks, and `npm run ig` wrapping the plugin's Python tools. |
| Carousel production | Remotion stills at 1080x1350 (Phase 2, own design pass). |
| Carousel ideas | Restore old C1-C3 as ideas 17-19 (companions of ideas 1-3). Old C4 ("recap from data") is dropped; `ig-plan` picks that slot from audit results. New companions come from `ig-repurpose`. |
| Cadence | Reels Mon/Tue/Thu/Fri, carousel Wed, stories on posting days, engagement round daily (20 min). |
| voice.md | Drafted from CLAUDE.md + idea 2; the user reviews audience, positions and off-limits. |

## Pipeline

| # | Stage | When | Skills | Output |
|---|---|---|---|---|
| 0 | Setup | once | `ig-profile` | `instagram/voice.md`, `instagram/profile.md` |
| 1 | Research | monthly | `ig-viral` | `instagram/swipe.md` |
| 2 | Review + plan | weekly | `ig-audit`, `ig-plan` | dates/status in `ideas/`, `instagram/engage.md` |
| 3 | Ideas | ongoing | `ig-plan`, `ig-reply` (formula #16), `ig-repurpose` | new `ideas/idea-NN-slug/idea.md` |
| 4 | Script reel | per reel | `ig-reel`, `ig-human` | 3 scored hooks, script, beat sheet |
| 4b | Script carousel | per carousel | `ig-carousel`, `ig-human` | `## Slides` table |
| 5 | Caption | per post | `ig-caption`, `ig-human` | linted caption |
| 6 | Build | per post | existing Remotion workflow | MP4 / PNG slides |
| 7 | Post day | posting days | `ig-story` | story frames |
| 8 | Engage | daily | `ig-comment`, `ig-reply`, `ig-dm` | copy-ready text |
| 9 | Measure | after posting | metrics in `idea.md`, tracker, `ig-audit` | README performance |

## Overrides (where the skills conflict with our rules)

- Our reel anatomy, safe zones (top 250 / bottom 350 / right 150) and 150 wpm (2.5 words/s) win over the skills' defaults.
- Skill state paths are `instagram/` in this repo, not `~/.claude/instagram/`.
- Nothing is posted, followed, liked or messaged by Claude, and Claude never logs into Instagram. `ig-viral` reads in the user's own browser with the user present.
- `ig-human` / `detect.py` findings on scripts are suggestions: script text changes only with the user's approval. Facts are never changed to raise a score.
- The detector's BURSTINESS check penalises our short, even explainer sentences; treat it as advisory.

## Tracker changes

- Format `C` (carousel) with `companion_of` (id of the reel it companions) and a `## Slides` table (`Slide | Headline | Body`): 6-10 slides, cover headline 6 words or fewer, headlines 7 or fewer, body 25 or fewer. Reel script rules don't apply to carousels.
- Reel fields `hook_formula` (id from `ig-reel/hooks.json`), `hook_score`, `question_score`: warned when missing on a scripted reel, an error when below 50.
- Metrics add `views`, `nonfollower_pct`, `hold_3s`. README performance shows views, multiple over the median, non-follower %, hold at 3 s, sends per reach.
- `npm run ig -- idea-NN-slug [--keywords "a,b"]` runs `hookscore.py`, `beats.py` (reels), `caption.py` and `detect.py` on one idea, using the installed plugin (`IG_SKILLS_DIR` overrides) with `PYTHONUTF8=1`.

## Phase 2

Remotion `Carousel` composition (1080x1350, one still per slide, brand tokens and components), designed when the first carousel is scripted.
