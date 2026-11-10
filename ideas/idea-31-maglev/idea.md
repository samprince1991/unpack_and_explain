---
id: 31
slug: maglev
title: "How a maglev train floats"
format: E
category: "Aviation & engineering"
subcategory: "Machines"
week: 7
date: 2026-12-17
status: scripted
hook_formula: 20
hook_score: 77.8
question_score: 62.2
hook: "You don't need wheels to hit 603 kilometers an hour."
source: "Wikipedia, SCMaglev; Guinness World Records"
verify:
  - "Hook says 'you don't need wheels': true only above about 150 km/h (it rolls on wheels below). The mechanism line says so; keep both"
  - "Caption says 'a second set of coils moves it forward': Wikipedia only says a linear synchronous motor powers a second set of guideway coils. Fine as said; check JR Central before adding detail"
notes: "Superconducting magnets on the train induce currents in figure-8 coils in the guideway walls; those coils repel/attract to lift and centre it. Only works with speed, so wheels below ~150 km/h. Separate propulsion coils (linear motor)."
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

# Idea 31: How a maglev train floats

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know how a train actually floats 10 cm up? | Question card over the Blender opener: a long-nosed maglev train (procedural, no JR livery) in a U-shaped guideway, the gap under the train amber. |
| Hook | You don't need wheels to hit 603 kilometers an hour. | Blender hook: low camera at guideway level, the train streaks past; on screen "603 km/h (375 mph)". |
| Setup | Normal trains roll on steel wheels. Japan's SCMaglev lifts off instead. | 2D line art: a steel wheel on a rail with shake lines on 'shake and wear', then the wheel fades and a gap opens on 'lifts off' (amber). |
| Mechanism | Powerful magnets ride inside the train, and the track walls are lined with coils of wire. As the train speeds past, its magnets make current flow in those coils, so the coils become magnets too. They push the train up and keep it centered. Below 150 kilometers an hour, that current is too weak, so it rolls on rubber wheels. | Blender cutaway front view: wide; close on a magnet block in the bogie on 'magnets' (amber); coils in the wall on 'coils of wire'; current arrows run round a figure-8 coil as the train passes on 'current flow'; push arrows up and inwards on 'push the train up and keep it centered'; propulsion coils light in sequence ahead on 'pulls it forward'; rubber wheels touch down, on screen "150 km/h (93 mph)"; wide. |
| Payoff | Above that, it floats 10 centimeters up. In 2015, it hit 603 kilometers an hour, a world record. | 2D chart: gap measured with a ruler, "10 cm (4 in)" on 'floats'; bar chart of train speed records with the 2015 bar amber on '603'. |
| Congrats | Congrats, you just learned how a maglev train floats. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Notes

- Hooks scored: #20 "You don't need wheels to hit 603 km/h." 77.8 STRONG (picked; VO spells out 'kilometers an hour', re-check with npm run ig); #26 "The world's fastest train flies 10 cm above its track." 44.0; "The fastest train ever doesn't touch its track." 40.8.
- Question cards scored: "Do you know how a train actually floats 10 cm up?" 62.2 (picked); "Do you know how Japan's maglev actually floats?" 62.2; "Do you know how a train actually floats?" 45.0.
- Hook title: "603 km/h, no wheels", highlight "no wheels".
- Follows the hovercraft (idea 27): another way to float. Mention in the caption.
- World: needs a `rail` world (guideway through hills).
- Units: 603 km/h = 375 mph; 150 km/h = 93 mph; 100 mm = 10 cm = 4 in.

## Caption

The fastest train ever hit 603 km/h (375 mph) without touching its track. Save this for your next train ride.

Japan's SCMaglev carries powerful magnets. As it speeds past coils of wire in the track walls, it makes current flow in them, and those coils turn into magnets that push the train up and keep it centered. A second set of coils moves it forward.

Below about 150 km/h the current is too weak, so it rolls on rubber wheels. Above that it floats about 10 cm (4 in) up. The record run was in April 2015.

Source: Wikipedia, SCMaglev; Guinness World Records

#maglev #train #japan #engineering #howitworks

## Verified facts

Checked 2026-11-10.

- L0 Series: 603 km/h (375 mph) on 21 April 2015, 'current world speed record for all trains'. [Wikipedia, SCMaglev](https://en.wikipedia.org/wiki/SCMaglev)
- Superconducting magnets on the bogies induce current in 'figure 8' coils along both guideway walls; the induced field lifts the train and pushes it back to centre if it drifts; lift-off at about 150 km/h (93 mph) to 100 mm (4 in); below that it 'runs on rubber wheels'. [Wikipedia, SCMaglev](https://en.wikipedia.org/wiki/SCMaglev)
- Propulsion: a linear synchronous motor powering a second set of guideway coils. [Wikipedia, SCMaglev](https://en.wikipedia.org/wiki/SCMaglev)
- Chuo Shinkansen (Tokyo to Nagoya) scheduled to open in 2034 (not in the script). [Wikipedia, SCMaglev](https://en.wikipedia.org/wiki/SCMaglev)
- Dropped: Shanghai's '431 km/h' (cut to 300 km/h in May 2021) and its '10 mm gap' (no primary source). [Wikipedia, Shanghai maglev](https://en.wikipedia.org/wiki/Shanghai_maglev_train)
