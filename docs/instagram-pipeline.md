# Instagram pipeline

The `instagram-agent` plugin (13 skills, `/ig-*`) runs the account around the Remotion build. Install it with `/plugin install instagram-agent@instagram-agent-skill`. Use the skills at every stage below; don't do these stages from memory. The overrides in `CLAUDE.md` win over anything a skill says.

## Stages

| # | Stage | When | Skills | Output |
|---|---|---|---|---|
| 0 | Setup | once | `/ig-profile` (score out of 100, rewrites) | `instagram/voice.md` reviewed by the user, `instagram/profile.md`. Re-run `/ig-profile` monthly |
| 1 | Research | monthly | `/ig-viral` (outlier multiple over each account's median, hook formulas) | `instagram/swipe.md` |
| 2 | Review + plan | weekly | `/ig-audit` on posted ideas (rank by multiple and sends per reach; separate hook problems from profile problems), then `/ig-plan` | New or moved ideas and dates in `ideas/`; the 10-account engagement list in `instagram/engage.md`. The user approves the week |
| 3 | Ideas | ongoing | `/ig-plan`, `/ig-reply` (a comment question many people share becomes an idea, formula #16), `/ig-repurpose` (a posted reel's mechanism becomes a companion carousel) | `ideas/idea-NN-slug/idea.md` under an existing sub-category |
| 4 | Script a reel | per reel | `/ig-reel`: 3 hooks from different `hooks.json` formulas, scored; best 50+; beat sheet. Then `/ig-human` | `topic`, `## Spine` (agreed first), `## Script` table, `## Cold read`, `hook_formula`, `hook_score`, `question_score`. The user approves the script. One-subject and flow rules: `CLAUDE.md` > Reel anatomy |
| 4b | Script a carousel | per carousel | `/ig-carousel`, then `/ig-human` | `## Slides` table. The user approves the copy |
| 5 | Caption | per post | `/ig-caption` (Job A for reels: ask + context + search terms; Job B for carousels: the hook), then `/ig-human`; `npm run ig` lint shows READY | `## Caption` |
| 6 | Build | per post | Per-post workflow (reels), `carousels.md` (carousels) | MP4 / slide PNGs |
| 7 | Post day | posting days | `/ig-story` (3-5 frames: reel frames or diagrams, since we're faceless; a quiz suits myth/fact posts) | Copy-ready frames. The user posts |
| 8 | Engage | daily, 20 min | `/ig-comment` (list in `engage.md`, two options per post), `/ig-reply` (our threads, first hour after posting), `/ig-dm` (keyword delivery, collab pitches, two follow-ups max) | Copy-ready text. The user posts or sends |
| 9 | Measure | after posting | Fill `metrics` from insights (views, reach, nonfollower_pct, hold_3s, watch_pct, likes, comments, shares, saves, follows), run the tracker | Feeds stage 2 |

**Cadence:** reels Mon/Tue/Thu/Fri, carousel Wed, stories on posting days, engagement round daily.

Which model or subagent handles each stage: `docs/model-tiers.md`.

## Skills

| Skill | Use it for |
|---|---|
| `/ig-reel` | Hooks, script and beat sheet for a reel |
| `/ig-carousel` | Slide copy for a carousel |
| `/ig-caption` | Every caption |
| `/ig-human` | Cleaning anything written before the user sees it |
| `/ig-viral` | Monthly niche research into `swipe.md` |
| `/ig-plan` | The weekly plan and engagement list |
| `/ig-audit` | Weekly post-mortem on posted ideas |
| `/ig-repurpose` | One reel or source into companion posts |
| `/ig-profile` | Profile score and rewrites |
| `/ig-story` | Story frames on posting days |
| `/ig-comment` | Comments on other accounts' posts |
| `/ig-reply` | Replies under our posts; questions become ideas |
| `/ig-dm` | Keyword delivery, warm messages, collab pitches |

## Running the checks

`npm run ig -- idea-NN-slug [--keywords "gps,satellites"]` runs the plugin's tools on one idea: `hookscore.py` (question card + hook, or carousel cover), `beats.py` at 150 wpm (reels), `caption.py` (feed-truncation box, hashtags, one ask, search terms) and `detect.py` (AI-text panel).

It's read-only: record `hook_formula`, `hook_score` and `question_score` in `idea.md` yourself. It needs the plugin installed (or `IG_SKILLS_DIR`), and it sets `PYTHONUTF8=1`, without which the tools crash on Windows. To run a tool directly: `PYTHONUTF8=1 python <skills>/ig-reel/hookscore.py --hook "one line"`.
