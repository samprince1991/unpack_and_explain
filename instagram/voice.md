# voice.md

Voice profile read by every instagram-agent skill (`/ig-reel`, `/ig-caption`, `/ig-human`, ...). In this repo the skills read `instagram/voice.md`, not `~/.claude/instagram/voice.md`.

Drafted by Claude on 2026-10-30 from CLAUDE.md and idea 2. Lines marked **TODO** need the owner's answer.

---

## Who I am

- **Name:** Unpack & Explain
- **Handle:** @unpack_and_explain
- **What I do, in one sentence:** Short explainer reels on how everyday tech, money and engineering actually work.
- **Tagline:** How things actually work
- **Who I am talking to:** **TODO** (draft: curious adults, 18-40, who use this stuff every day and never learned how it works; not engineers)
- **What I sell:** Nothing yet. The goal is follows, saves and sends. **TODO** if that changes.

## What I sound like

- **Three reels that sound most like me:** idea 2 (`ideas/idea-02-gps/idea.md`), live at https://www.instagram.com/reel/DfE-k9so_ys. Add two more once they're posted.
- **On camera I am:** faceless. Upbeat and warm voice-over, never flat, never hype.
- **Face on camera:** never (faceless channel; drawn diagrams only, no stock footage or AI imagery).
- **Voiceover or to-camera:** voiceover only, ElevenLabs voice Brian. The same voice and settings on every reel.
- **Pace:** 150 words per minute (2.5 words/s). Use `beats.py --wpm 150`.
- **Words I actually use:** "actually", "your phone", "here's the trick", plain verbs, everyday comparisons, numbers with units (metric + imperial).
- **Words I would never say out loud:** "stop scrolling", "in today's video", "follow for more", "you won't believe", "mind-blowing", "insane", "game-changer", "hack".
- **Punctuation for the voice:** short sentences, "?" on the question, **no "!"** anywhere (the voice over-stresses the word before it). The congrats line starts "Congrats," with a comma.
- **Do I swear:** no.
- **Emoji in captions:** never.

## Fixed lines

- **Question (opens every reel):** "Do you know how {topic} ...?" style, 7 words or fewer with something concrete, `hookscore.py` 50+.
- **Congrats (before the CTA):** "Congrats, you just learned how {topic} ..."
- **Spoken CTA (exact):** "Follow Unpack and Explain for how things actually work."

## My positions

Beliefs some of the audience doesn't share. Good reels start here. **TODO**: confirm or replace.

1. Most "tech myths" survive because nobody explains the mechanism (GPS doesn't track you; the cloud is someone else's computer).
2. Failures teach better than successes: every big outage or crash has a one-sentence cause.
3. You don't need maths to understand how things work, just the right picture.

## Off limits

- **Topics I do not post about:** politics, real politicians, war and weapons, tragedy played for views, anything sexual, bullying, mocking groups. (Same list as the meme rules in CLAUDE.md.)
- **Claims I am not allowed to make:** no financial, medical or legal advice. Every fact needs a source shown on screen; anything unverified stays in the idea's `verify` list until checked.
- **Clients, numbers or names I cannot say publicly:** **TODO**

## Proof I can use

This is an explainer channel, so proof means **sourced facts**, not personal results. Use the idea's `source` and verified figures only. Never invent a number: leave `{{number}}` and add it to `verify`.

- Channel results: **TODO** once posts have metrics (fill from `ideas/README.md` Performance).

## The ask

- **Spoken ask:** follow (the fixed CTA line).
- **Caption ask:** one per post, usually "save this" for reels and carousels. **TODO** if you want a keyword ask.
- **My keyword CTA, if I use one:** none yet. **TODO**
- **Where my link goes:** **TODO** (bio link)
