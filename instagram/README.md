# instagram/

State for the instagram-agent skills (plugin `instagram-agent`, github.com/Jakeschincariol/instagram-agent-skill). The skills default to `~/.claude/instagram/`; in this project they read and write here instead, so everything is versioned with the content.

| File | Written by | Read by | What it holds |
|---|---|---|---|
| `voice.md` | owner (Claude drafted it) | every skill | who we are, how we sound, words we never say, the fixed lines |
| `swipe.md` | `/ig-viral` (monthly) | `/ig-reel`, `/ig-plan` | what's working in the niche, ranked by multiple over each account's median |
| `profile.md` | `/ig-profile` (once, then monthly) | `/ig-audit` | profile score out of 100 and the rewrites |
| `engage.md` | `/ig-plan` (weekly), `/ig-comment` | `/ig-comment`, `/ig-dm` | the 10 accounts for the engagement round, and who we commented on this week |

Not here on purpose:
- The skills' `log.md` (hook formula per post) lives in each `ideas/idea-NN-slug/idea.md` (`hook_formula`, `hook_score`, `question_score`, `metrics`).
- The skills' `plan.md` is the schedule in `ideas/README.md` (each idea's `date`).

Create `swipe.md`, `profile.md` and `engage.md` the first time their skill runs.
