# Unpack & Explain

Faceless explainer reels for Instagram (YouTube Shorts later). Tagline: "How things actually work". Handle: `@unpack_and_explain`.

## Folders

| Path | What it is |
|---|---|
| `posts/` | Content tracker: one `post-NN-slug/post.md` per post with plan, status, script, caption and metrics. `posts/README.md` is the generated overview |
| `video/` | Remotion project that turns a script into a branded reel |
| `logo/` | Master logo files. Never edit; `npm run assets` copies what the video needs |
| `docs/specs/` | Brand and video standards design |
| `docs/plans/` | Implementation plans (historical record) |
| `CLAUDE.md` | Production rules: brand, layout, audio, workflow, QA checklist |

## How a post is made

1. Add or edit `posts/post-NN-slug/post.md` (plan in the front matter, then the script), and run `npm run tracker` from `video/`.
2. Set `status: scripted` once the script is approved.
3. Build it in `video/` (`script.ts`, voice-over, scenes), check it against the QA checklist in `CLAUDE.md`.
4. Render and master, upload the `.master.mp4`, set `status: posted` and fill in the metrics later.

Setup: `cd video && npm install`, put `ELEVENLABS_API_KEY` in `video/.env` (see `.env.example`), then `npm run dev`.
