# Unpack & Explain

Faceless explainer reels for Instagram (YouTube Shorts later). Tagline: "How things actually work". Handle: `@unpack_and_explain`.

## Folders

| Path | What it is |
|---|---|
| `Unpack_and_Explain_Tracker.xlsx` | Content plan (post IDs, dates, formats, status, metrics), all scripts, brand kit |
| `posts/` | Approved scripts, one folder per reel (`post-NN-slug`, NN = tracker ID). See `posts/README.md` |
| `video/` | Remotion project that turns a script into a branded reel |
| `logo/` | Master logo files. Never edit; `npm run assets` copies what the video needs |
| `docs/specs/` | Brand and video standards design |
| `docs/plans/` | Implementation plans (historical record) |
| `CLAUDE.md` | Production rules: brand, layout, audio, workflow, QA checklist |

## How a post is made

1. Plan it in the tracker (Content Plan row) and write the script (Scripts tab).
2. Copy the approved script to `posts/post-NN-slug/script.md`.
3. Build it in `video/` (`script.ts`, voice-over, scenes), check it against the QA checklist in `CLAUDE.md`.
4. Render and master, then upload the `.master.mp4`.

Setup: `cd video && npm install`, put `ELEVENLABS_API_KEY` in `video/.env` (see `.env.example`), then `npm run dev`.
