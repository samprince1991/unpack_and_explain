# Unpack & Explain

Faceless explainer reels for Instagram (YouTube Shorts later). Tagline: "How things actually work". Handle: `@unpack_and_explain`.

## Folders

| Path | What it is |
|---|---|
| `ideas/` | Content tracker: one `idea-NN-slug/idea.md` per idea, with its plan, status, script, caption and metrics. `ideas/README.md` is the generated overview |
| `video/` | Remotion project that turns a script into a branded reel or carousel |
| `blender/` | Headless Blender scripts and procedural models for the 3D |
| `instagram/` | Voice profile and working files for the Instagram skills |
| `logo/` | Master logo files. Never edit; `npm run assets` copies what the video needs |
| `docs/` | Reference docs (3D, motion, audio, carousels, Elements, Instagram) and the design decisions |
| `CLAUDE.md` | Production rules: brand, layout, commands, workflow, QA checklist |

## How a post is made

1. Add or edit `ideas/idea-NN-slug/idea.md` (plan in the front matter, then the script), and run `npm run tracker` from `video/`.
2. Set `status: scripted` once the script is approved.
3. Build it in `video/` (`script.ts`, voice-over, 3D, sounds, scenes) and check it against the QA checklist in `CLAUDE.md`.
4. Render and master, upload the `.master.mp4`, set `status: posted`, and fill in the metrics later.

## Setup

A fresh clone needs:

- Node, then `cd video && npm install`.
- `video/.env`, based on `video/.env.example`: `ELEVENLABS_API_KEY` and `BLENDER_PATH`.
- [Blender 5.3](https://www.blender.org/download/) for the 3D.
- Python with Pillow for QA contact sheets (`pip install pillow`).
- The Claude Code plugin for the Instagram skills: `/plugin install instagram-agent@instagram-agent-skill`.

Blender renders (`video/public/posts/*/3d/`) and final videos (`video/out/`) aren't in git. Regenerate clips with `npm run blender -- post-NN-slug`, and start Studio with `npm run dev`.
