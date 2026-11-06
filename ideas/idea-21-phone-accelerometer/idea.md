---
id: 21
slug: phone-accelerometer
title: "How your phone knows which way is up"
format: E
category: "Everyday tech"
subcategory: "Devices"
week: 5
date: 2026-11-30
status: idea
hook: "Nobody tells you your phone hides a tiny weight on springs."
source: "STMicroelectronics accelerometer product pages; capacitive MEMS accelerometer patents"
verify:
  - "Exact proof-mass size in a specific phone sensor (no public spec found; say 'smaller than 1 mm (0.04 in)', not a precise figure)"
notes: "MEMS accelerometer: a silicon proof mass on springs between comb fingers; tilt or shake moves it, the capacitance change becomes a number. Great exploded-view 3D (chip > die > comb)."
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

# Idea 21: How your phone knows which way is up

Not scripted yet. Add `## Script` and `## Caption` sections (see idea-02-gps) when it is.

## Verified facts

Checked 2026-11-06.

- Most phone accelerometers are capacitive MEMS: a silicon proof mass hangs on tiny springs, and its comb fingers sit between fixed fingers. When the mass moves, the gap changes, so the capacitance changes, and the chip turns that into a number. [patent US6910379](https://patents.google.com/patent/US6910379)
- The whole sensor package is about 2 x 2 x 1 mm (0.08 x 0.08 x 0.04 in). [STMicroelectronics](https://www.st.com/en/mems-and-sensors/accelerometers.html)
- A published research device has a 750 x 560 µm proof mass and 120 µm long, 4 µm wide fingers, so 'smaller than 1 mm' is a safe way to say it. Phone parts aren't published. [Silicon-on-glass accelerometer paper](https://pure.bit.edu.cn/en/publications/a-micromachined-silicon-on-glass-accelerometer-with-an-optimized-/)
- A tilt moves the mass only a tiny distance (popular sources say nanometres to a fraction of a micrometre). Secondhand, so don't put a number on screen.
- X and Y usually use in-plane combs; Z uses a tilting mass or plates under it. Layouts differ between makers.
