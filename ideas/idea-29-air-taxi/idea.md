---
id: 29
slug: air-taxi
title: "How an electric air taxi flies"
topic: "air taxi"
format: E
category: "Aviation & engineering"
subcategory: "Flight"
week: 7
date: 2026-12-14
status: scripted
hook_formula: 20
hook_score: 77.8
question_score: 62.2
fit: high
fit_why: "vehicle flying over a city"
hook: "You don't need a runway to fly at 200 mph."
source: "Joby Aviation; Wikipedia, Joby Aviation; Motley Fool, 30 Oct 2026"
verify:
  - "That all six propellers tilt (rather than some fixed) is widely reported but not on the pages fetched; check Joby's technology page"
  - "Dubai first-passenger timing: as of 30 Oct 2026 Joby planned it 'before the end of 2026', pending UAE GCAA approval. Re-check on render day and update the payoff if it has happened"
notes: "Takes off like a drone (props up), cruises like a plane (props forward, wing makes lift), lands like a drone. One idea: the tilt."
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

# Idea 29: How an electric air taxi flies

## Spine

| Part | Job |
|---|---|
| Question | how six propellers fly an air taxi |
| Hook | no runway, and it still flies at 200 mph |
| Setup | it has to lift straight up, then fly fast; most aircraft can only do one |
| Mechanism | six propellers point up to lift off like a drone, tilt forward so the wing carries it like a plane, and tilt back to land |
| Payoff | a pilot and four passengers, up to 150 miles a charge; first passengers planned in Dubai |
| Answer | Mechanism: the propellers point up to lift, then tilt forward so the wing carries it |

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know how 6 propellers actually fly an air taxi? | Question card over the Blender opener: a six-propeller tilt-wing air taxi (procedural, no Joby livery) on a rooftop pad, the props amber. |
| Hook | You don't need a runway to fly at 200 mph. | Blender hook: the aircraft rises straight up past the camera; on screen "200 mph (320 km/h)". |
| Setup | An air taxi has to lift straight up, then fly fast. Most aircraft can only do one of those. | 2D: the air taxi in side view on a pad; on 'straight up' it rises with an up arrow; on 'fast' it streaks forward with speed lines (amber on the taxi); on 'one of those' the two moves split into two paths from the same taxi. Parallax + dust. |
| Mechanism | It has six electric propellers. For takeoff, they point up, like a drone, and lift it straight off the pad. Then the propellers tilt forward. Now the wing carries the weight, and the propellers just push it along, like a plane. To land, they tilt back up. | Blender: wide on the aircraft; close on one prop pointing up on 'six electric propellers' (amber), lift arrows down; wide as it climbs; close on a wing nacelle as it tilts forward on 'tilt forward' (amber); lift arrow moves to the wing on 'wing carries the weight'; wide cruise; props tilt back up on 'land'. |
| Payoff | It carries a pilot and four passengers, up to 150 miles on one charge. Joby is aiming to fly its first passengers in Dubai. | 2D map style: a pad-to-pad line draws on '150 miles' with "240 km" on screen; seat icons 1+4 on 'pilot and four passengers' (pilot seat amber); a pin on Dubai on 'Dubai'. |
| Congrats | Congrats, you just learned how an air taxi flies. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Cold read

About: Joby's electric air taxi
Asks: how six propellers fly an air taxi
Answer: they point up to lift it like a drone, then tilt forward so the wing holds it up like a plane

## Notes

- Hooks scored: #20 Permission "You don't need a runway to fly at 200 mph." 77.8 STRONG (picked); #3 "Nobody tells you an air taxi's propellers tilt mid-flight." 52.2; #13-style "This air taxi takes off like a drone and flies like a plane." 28.7.
- Question cards scored: "Do you know how 6 propellers actually fly a plane?" 62.2 (picked); "Do you know how Joby's air taxi actually flies?" 46.6; "Do you know how an air taxi actually flies?" 39.4.
- Hook title: "No runway, 200 mph", highlight "No runway".
- World: needs a `city` world (rooftop pad, skyline at dusk). Idea 36 can reuse it.
- Units: 200 mph = 320 km/h; 150 mi = 240 km.

## Caption

An air taxi takes off like a drone and flies like a plane. Save this for the first time you see one overhead.

Joby's aircraft has six electric propellers. For takeoff they point up and lift it straight off the pad. Then they tilt forward, the wing takes over the lifting, and the propellers just push it along. To land, they tilt back up.

It carries a pilot and four passengers, up to 150 miles (240 km) on a charge, at up to 200 mph. Joby plans its first passenger flights in Dubai.

Source: Joby Aviation; Wikipedia, Joby Aviation

#airtaxi #evtol #aviation #electricaircraft #howitworks

## Verified facts

Checked 2026-11-10.

- Joby S4: 'six rotating propellers' (replacing an earlier 12-prop concept), 'four-passenger commercial aircraft with a pilot', range 'up to 150 miles (240 km) on a single charge', 'top speed of 200 mph (320 km/h)'. [Wikipedia, Joby Aviation](https://en.wikipedia.org/wiki/Joby_Aviation)
- Joby site: '200 mph top speed', 'Vertical take-off and landing'. [jobyaviation.com](https://www.jobyaviation.com/)
- No full FAA type certificate yet; first FAA-conforming S4 began flight tests in March 2026. [Wikipedia, Joby Aviation](https://en.wikipedia.org/wiki/Joby_Aviation)
- Dubai: six years of exclusive rights; first passenger operations planned before end of 2026, pending GCAA authorization and vertiports. [Motley Fool, 30 Oct 2026](https://www.fool.com/investing/2026/10/30/joby-aviations-dubai-launch-is-the-1-catalyst-that/), [Joby IR](https://ir.jobyaviation.com/news-events/press-releases/detail/162/dubai-air-taxi-network-takes-flight-joby-completes)
- In cruise the wing produces the lift and the propellers produce thrust: standard tiltrotor flight. [NASA Glenn, four forces](https://www.grc.nasa.gov/www/k-12/airplane/forces.html)
