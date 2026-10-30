---
id: 20
slug: vibe-coding
title: "How vibe coding actually works in 2026"
format: E
category: "Everyday tech"
subcategory: "AI"
week: 5
date: 2026-11-30
status: rendered
hook_formula: 20
hook_score: 70
question_score: 62
hook: "In 2026, you don't need to read one line of code to build an app."
source: "Andrej Karpathy on X (Feb 2025); Anthropic, How Claude Code works"
verify: []
metrics:  # fill in after posting
  views: null
  reach: null
  nonfollower_pct: null  # % of reach from non-followers
  hold_3s: null  # % of viewers still watching at 3 s
  watch_pct: null  # average watch time, % of video length
  likes: null
  comments: null
  shares: null
  saves: null
  follows: null
---

# Idea 20: How vibe coding actually works in 2026

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know how vibe coding actually works in 2026? | Question card (template). |
| Hook | In 2026, you don't need to read one line of code to build an app. | A single line of plain text types itself into a chat box; a stack of code lines below it blurs and fades out. |
| Setup | It's called vibe coding. You type 'make me a habit tracker app', and an AI agent writes all the code. | Speech bubble with a sentence flows into a small agent icon; code files stack up on the other side. |
| Mechanism | Here's the trick. The agent doesn't answer once. It reads your project, plans the steps, and writes the code. Then it runs it. If it crashes, it reads the error, fixes the code, and runs again. It loops until it works. | A circular loop builds node by node (folder, checklist, code, play). On "crashes" an amber error dot appears; it travels the loop once more and turns into a check. |
| Payoff | But it's still predicting likely code. It doesn't know what you meant. So "it runs" doesn't mean "it's right". Always test what it builds. | The finished app screen with a check; a second look shows one wrong detail circled in amber. |
| Congrats | Congrats, you just learned how vibe coding works. | Congrats card (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Notes

- Hook formula #20 Permission (70, STRONG). Alternatives scored: "One sentence, zero code, a working app. Here's what actually happens." (61), "Stop thinking AI writes the app once. It actually loops." (55).
- `hookText` (on screen, 2 lines max): "Apps with zero code" ("No code needed in 2026" wrapped to 3 lines at hook size).
- Agent loop checked 2026-10-30 against https://code.claude.com/docs/en/how-claude-code-works ("gather context, take action, verify results", repeating; example: run tests, read the error output, edit, run again).
- Vibe coding was named by Andrej Karpathy in a post on X, 2 Feb 2025 (confirmed). Not spoken, can go in the caption.
- Long beats (setup, mechanism) get a visual change every 2 s, per CLAUDE.md.

## Caption

Save this before you build an app with AI in 2026. It runs. That doesn't mean it's right.

Vibe coding is when you describe an app in plain words and an AI coding agent writes every line. Andrej Karpathy named it in February 2025.

The agent doesn't answer once. It reads your project, writes the code, runs it, reads the error, then tries again. Over and over, until it works.

What it can't check is what you meant. So test it.

#vibecoding #aicoding #howitworks #explained
