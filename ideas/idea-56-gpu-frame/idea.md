---
id: 56
slug: gpu-frame
title: "How a graphics card draws one frame"
topic: "graphics card"
format: E
category: "Games & gadgets"
subcategory: "PC gaming"
week: 13
date: 2027-01-25
status: idea
fit: low
fit_why: "box inside a PC, no real place"
hook: "Nobody tells you your graphics card paints pixels in parallel."
source: "{{source}}: GPU maker docs (e.g. NVIDIA or AMD developer guides on the graphics pipeline)"
verify:
  - "Pipeline: triangles -> vertices placed -> rasterised to pixels -> each pixel shaded, thousands of cores at once: confirm wording"
  - "Core count on a current card ({{number}}): spec sheet"
notes: "Angle: a CPU does a few hard jobs in a row; a GPU does millions of tiny identical jobs at once. Every frame, the world becomes triangles, the triangles become pixels, and thousands of small cores colour pixels at the same time. Payoff: that's why 60 frames a second is possible. Visual: one triangle rasterised, one pixel amber."
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

# Idea 56: How a graphics card draws one frame

Not scripted yet. Add `## Spine`, `## Script`, `## Cold read` and `## Caption` when it is.
