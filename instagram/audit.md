# Audit

Read before planning or picking the next topics. Update after each insights export.

## 2026-11-12 (export Oct 12 - Nov 11, 2026)

10 reels with data (gold jewellery, post 38, went up 11/11 21:36 and has no data yet), 1 carousel. Median reel views: **130**.

| Post | Views | x median | Reach | Likes | Shares | Saves | Follows | World | Format | Age at export |
|---|---|---|---|---|---|---|---|---|---|---|
| 26 bulbous bow | 1,384 | 10.6x | 1,277 | 5 | 0 | 1 | 0 | sea | E | 3 d |
| 27 hovercraft | 1,379 | 10.6x | 1,236 | 12 | 3 | 1 | 1 | coast | E | 2 d |
| 12 cloud myth | 141 | 1.1x | 127 | 4 | 0 | 0 | 0 | none | Q | 7 d |
| 28 Tesla Roadster | 134 | 1.0x | 124 | 1 | 0 | 0 | 0 | track | Q | 1.5 d |
| 02 GPS | 132 | 1.0x | 117 | 2 | 0 | 0 | 1 | none | E | 14 d |
| 21 accelerometer | 127 | 1.0x | 122 | 0 | 0 | 0 | 0 | none | E | 3 d |
| 10 undersea cables | 122 | 0.9x | 118 | 1 | 0 | 0 | 0 | none | E | 8 d |
| 03 jet engine | 121 | 0.9x | 117 | 0 | 0 | 0 | 0 | none | F | 10 d |
| 20 vibe coding | 120 | 0.9x | 108 | 0 | 0 | 0 | 0 | none | E | 10 d |
| 01 card payment | 3 | 0.0x | 2 | 0 | 0 | 0 | 0 | none | E | 13 d |
| 19 jet engine carousel | 0 | n/a | 0 | 0 | 0 | 0 | 0 | n/a | C | 6 d |

### What the data says

1. **Two tiers.** Almost every reel stops at about 120 views, which is Instagram's first test batch. Only 26 and 27 got pushed to the next batch (about 10x). So the question is what got those two past the first test, not small differences inside the 120s.
2. **What 26 and 27 share:** they are the first two reels built inside a Blender world (sea, coast). Frame 0 looks like a real scene: a large object everyone recognises, sitting in water. Every reel before them is a dark diagram backdrop (`worldOptOut` or no 3D). Both are also physical "you've seen this, never knew why" subjects, and both are 42 s, the shortest of the batch. **Confidence: low to medium.** n = 2, and the one other world reel (28, Tesla, track world) stayed at 120. But 28 is confounded: Q format, a generic coupe model rather than a recognisable car, a news topic, posted 15 h after 27, and only 1.5 days old at export.
3. **Hook score doesn't predict reach here.** The winners scored 76-78; the flops scored 81-83 (01, 10, 12, 28). Formula #3 "Nobody tells you" is on both winners and flops. Don't pick between scripts on `hookscore.py` alone.
4. **Time of day: no signal.** 03 and 12 went up at the same hour as the winners (about 01:00-02:00) and stayed at 120.
5. **Views without engagement.** 27 converted 1 follow and 3 shares from 1,236 reach (0.24% sends); 26 none from 1,277. When a reel does travel, almost nobody follows. Per `/ig-audit`, that's a profile and payoff problem, not a hook problem (run `/ig-profile`).
6. **01 card payment (3 views) is broken, not just weak.** It was never shown to the test batch. Check Settings > Account status > "What can't be recommended" for that reel.
7. **The carousel (19) got 0 views.** Not enough to judge carousels yet.

### Missing (needed to confirm the "why")

`hold_3s`, `watch_pct`, `nonfollower_pct` for 26, 27, 28 and 21 (one flop with no world). If 26/27 hold much better at 3 s, the world opener is the cause. If hold is the same and only non-follower reach differs, it's topic or distribution luck.

### Do next

- Keep worlds on every reel (already required). Prefer subjects that are big, recognisable physical things with a real place to sit in: vehicles, ships, structures. The queue (31 maglev, 29 air taxi, 30 fan car, 33 helicopter, 34 F1, 35 robotaxi) fits.
- Use a recognisable model of the actual subject; a generic stand-in (28's coupe) gives the opener nothing to recognise.
- Re-check 28 and 38 at 7 days old before calling them. 38 (gold, bench world) is the first test of the world effect outside vehicles.
- Fix follow conversion before chasing more reach (`/ig-profile`).
