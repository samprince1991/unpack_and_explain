---
id: 33
slug: helicopter-steering
title: "How a helicopter steers"
format: E
category: "Aviation & engineering"
subcategory: "Flight"
week: 8
date: 2026-12-21
status: scripted
hook_formula: 3
hook_score: 81.4
question_score: 62.2
hook: "Nobody tells you 2 plates do all of a helicopter's steering."
source: "FAA Helicopter Flying Handbook (FAA-H-8083-21B), ch. 3"
verify:
  - "Check the wording against the FAA Helicopter Flying Handbook ch. 3 (Helicopter Flight Controls): the fetched sources were secondary (Migflug, helisimmer) citing it"
notes: "Swashplate: non-rotating lower plate moved by the controls, rotating upper plate linked to each blade. Collective = all blades' pitch together (up/down). Cyclic = pitch varies once per turn, tilting the rotor disc (direction). Torque reaction countered by the tail rotor; pedals change its pitch."
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

# Idea 33: How a helicopter steers

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know how 1 rotor actually steers a helicopter? | Question card over the Blender opener: a light single-rotor helicopter (procedural) hovering, the rotor hub amber. |
| Hook | Nobody tells you 2 plates do all of a helicopter's steering. | Blender hook: camera rises to the rotor hub and finds the two plates (amber) on '2 plates'. |
| Setup | A plane steers with flaps on its wings. A helicopter's one rotor has to do everything. | 2D line art: a plane silhouette with flaps flicking on 'flaps', then a single rotor disc circle on 'one spinning rotor' (amber). |
| Mechanism | Under the rotor sits the swashplate: one plate stays still, one spins. Pull the collective lever, and the whole plate rises. Every blade bites harder, so it climbs. Push the cyclic stick, and the plate tilts. Each blade bites harder on one side, the rotor tilts, and the helicopter goes that way. | Blender close-ups: the swashplate, lower plate neutral, upper plate spinning on 'one that spins'; plate rises on 'whole plate rises', all blades twist up together (amber), helicopter climbs; plate tilts on 'tilts', one side of the blade circle highlighted on 'one side'; the rotor disc tilts and the helicopter drifts that way; wide. |
| Payoff | But spinning the rotor twists the body the other way. So a small tail rotor pushes sideways to hold the nose straight. | Blender wide: body starts to turn opposite the rotor (curved arrow) on 'twists the body'; tail rotor spins up (amber) on 'tail rotor', side arrow from it, nose holds still. |
| Congrats | Congrats, you just learned how a helicopter steers. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Notes

- Hooks scored: #3 "Nobody tells you 2 plates do all of a helicopter's steering." 81.4 STRONG (picked); #3 "Nobody tells you a helicopter tries to spin itself around." 52.2; "A helicopter steers by tilting a spinning wing." 30.0.
- Question cards scored: "Do you know how 1 rotor actually steers a helicopter?" (re-check with npm run ig); "Do you know how 2 plates actually steer a helicopter?" 62.2 (repeats the hook); "Do you know how a helicopter actually steers?" 45.0.
- Hook title: "2 plates steer it all", highlight "2 plates".
- No numbers needed, so no unit conversions.
- World: the `coast` world works (helicopter over the shore) or the `city` world.

## Caption

A helicopter doesn't have flaps on a wing. It's got one spinning rotor. Save this for the next one you hear overhead.

Under the rotor sits the swashplate, one plate that stays still and one that spins. The collective lever raises the whole plate, every blade bites harder, and it climbs. The cyclic stick tilts the plate, so each blade bites harder on one side of its circle. The rotor tilts, and the helicopter goes that way.

There's a catch. Spinning the rotor twists the body the other way. The small tail rotor pushes sideways to hold the nose straight, and the pedals change how hard it pushes.

Source: FAA Helicopter Flying Handbook

#helicopter #aviation #pilot #engineering #howitworks

## Verified facts

Checked 2026-11-10.

- Swashplate: lower plate moved by the pilot's controls and non-rotating; upper plate turns with the rotor and changes each blade's pitch through pitch links. Collective changes all blades' pitch equally; cyclic varies pitch once per revolution, tilting the rotor disc. [Migflug, based on FAA HFH ch. 3](https://migflug.com/afterburner/?p=28402082), [FAA Helicopter Flying Handbook](https://www.faa.gov/sites/faa.gov/files/helicopter_flying_handbook.pdf)
- Main-rotor torque turns the fuselage the opposite way; the tail rotor counters it and the anti-torque pedals change its pitch. [Migflug](https://migflug.com/afterburner/?p=28402082), [FAS, Helicopter Controls](https://man.fas.org/dod-101/sys/ac/docs/poh/heli-03.htm)
