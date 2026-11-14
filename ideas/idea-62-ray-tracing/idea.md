---
id: 62
slug: ray-tracing
title: "How ray tracing lights a game"
topic: "ray tracing"
format: E
category: "Games & gadgets"
subcategory: "PC gaming"
week: 14
date: 2027-02-02
status: idea
fit: low
fit_why: "abstract graphics topic, no real place"
hook: "Nobody tells you ray tracing runs light backwards."
source: "{{source}}: NVIDIA developer docs on ray tracing, or Pharr et al., Physically Based Rendering"
verify:
  - "Rays are cast from the camera through each pixel, bounce off surfaces and are checked toward lights: confirm"
  - "Rays per pixel in real-time games ({{number}}) and denoising: confirm"
notes: "Angle: in real life light flies from the lamp to your eye, but almost all of it never arrives. A game saves work by firing rays from the camera into the scene and checking whether each hit point can see a light. Payoff: real reflections and shadows. One comparison: older baked lighting. Visual: camera, one pixel, one ray bouncing; the ray amber."
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

# Idea 62: How ray tracing lights a game

Not scripted yet. Add `## Spine`, `## Script`, `## Cold read` and `## Caption` when it is.
