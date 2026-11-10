---
id: 28
slug: tesla-roadster-myth
title: "Myth: Tesla's new Roadster is a flying car"
topic: "Roadster"
format: Q
category: "Aviation & engineering"
subcategory: "Cars"
week: 6
date: 2026-12-11
status: rendered
hook_formula: 3
hook_score: 81.4
question_score: 65.2
hook: "Nobody tells you Tesla's flying car runs on compressed air."
source: "Tesla Roadster unveil, 15 Oct 2026 (TechCrunch, CNN, Drive Tesla Canada)"
verify:
  - "'About 600 liters of compressed air' and 'ten nozzles' are Lars Moravy's words at the unveil as reported by TechCrunch; one report says only two main thrusters plus attitude thrusters. Check Tesla's own Roadster page before rendering"
  - "The fan 'sucking the car down' is the Performance trim's 'multi-mode suction system' (TechCrunch); confirm the jump car (Thrust/Rocket trim) also has it, or say 'the road version'"
  - "Five cars jumped (Cybercab, Cybertruck, Semi, Model Y, Model 3) per TechCrunch; heights (27 ft) are only in one report, so they are not in the script"
notes: "MYTH: Tesla built a flying car. FACT: cold-gas thrusters fed by compressed air make it hop; nothing holds it up once they stop. A fan does the opposite (suction downforce). Keep Musk out of VO and caption (brand safety)."
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

# Idea 28: Myth: Tesla's new Roadster is a flying car

## Spine

| Part | Job |
|---|---|
| Question | how Tesla's Roadster flies |
| Hook | the 'flying car' runs on compressed air |
| Setup | the Roadster jumped five parked cars; myth: it's a flying car |
| Mechanism | no wings; about 600 L of compressed air blasts from ten nozzles and shoves the car the other way, like rocket thrusters; it drops when they stop |
| Payoff | fact: it's a car that jumps; a fan underneath sucks it down for grip |
| Answer | Mechanism: it doesn't fly; compressed-air nozzles shove it up and it comes straight back down |

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know how Tesla's Roadster actually flies? | Question card over the Blender opener: a low, generic two-seat sports coupe (procedural, no Tesla badges or logo) on a test-track ramp at dusk; the rear nozzles amber. |
| Hook | Nobody tells you Tesla's flying car runs on compressed air. | Blender hook: camera slides along the side of the car to a cutaway of the air tanks (amber on 'compressed air'). |
| Setup | In October, Tesla's new Roadster jumped over five parked cars. Myth: it's a flying car. | 2D kinetic type + line art: five simple car silhouettes in a row on 'five parked cars', a dashed arc jumps over them on 'jumping'; MYTH stamp (coral) on 'flying car'. |
| Mechanism | There are no wings. Tanks hold about 600 liters of compressed air, and ten nozzles let it out. Air blasts one way, so the car gets shoved the other way. It's the same trick rockets use to steer in space. When the nozzles stop, the car comes straight back down. | Blender cutaway: wide on the car; close on the tank stack on '600 liters' (amber) with on-screen "600 L (159 US gal)"; close on one nozzle on 'ten nozzles', a cone of air out (amber) and an arrow on the car the opposite way on 'shoved'; small spacecraft silhouette with a puff on 'rockets'; wide: the arc of the jump, air cone cuts off on 'stop' and the car drops back to the ground line. |
| Payoff | FACT: it's a car that jumps. And a fan underneath does the opposite job, sucking the car down onto the road for grip. | 2D: FACT stamp (teal) on 'car that jumps'; side-view line art of the underbody, a fan (amber) and arrows pulling down into the road on 'sucking the car down'. |
| Congrats | Congrats, you just learned how Tesla's Roadster really jumps. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Cold read

About: Tesla's new Roadster
Asks: how the Roadster flies
Answer: it doesn't really fly: compressed air blasting from ten nozzles shoves it into a jump, then it comes back down

## Notes

- Hooks scored (hookscore.py): #3 Nobody Tells You "Nobody tells you Tesla's flying car runs on compressed air." 81.4 STRONG (picked); #20 Permission "You don't need wings to jump a car over five cars." 77.8; #22 Contrarian "Tesla's new Roadster isn't a flying car. It hops." 39.2.
- Question cards scored: "Do you know how Tesla's Roadster actually flies?" 65.2 (picked; the FACT answers 'it doesn't'); "Can Tesla's new Roadster actually fly?" 59.0.
- Hook title (28 chars max): "Flying on bottled air", highlight "bottled air".
- Model: draw a generic coupe, not a copy of the Roadster body, and no Tesla logo (trademark). Name the car in VO/caption only. Built as procedural `coupe` (`blender/models/coupe.py`, license own): `body` shell with `glass`, `lights`, `trim` (skirts, intakes) and a rear `wing` (all `away` in the cutaway), `floor`, `cabin` (seats, steering wheel), `tanks` (key), `pipes`, spoked `wheels`, the key sill `nozzle`, seven more `nozzles`, two `rear` nozzles, appear-only `jet`, `jets` and `push` (arrow up over the roof); group `car` hops with a `shift` beat. Not the previous post's model.
- World: new `track` world (`blender/world/track.py`): test track at dusk, edge lines, barrier and light towers on the far side, launch ramp ahead. The same world can serve ideas 30 and 34.
- Timely: the unveil was 15 Oct 2026. Consider moving this ahead of older ideas in the schedule.
- Units: 600 L = 159 US gal.

## Caption

Tesla's new Roadster jumped over five cars. It still isn't a flying car. Save this for the next time someone says it is.

At the October unveil, Tesla said the car carries about 600 liters of compressed air and lets it out through ten nozzles. Air goes one way, the car goes the other. That's the same cold-gas trick spacecraft use to turn. Once the nozzles stop, nothing holds the car up, so it comes back down.

There's a second trick under the car: a fan that sucks it down onto the road for more grip. Production is planned for 2028, and the jumping features aren't approved for public roads.

Source: Tesla unveil, 15 Oct 2026, via TechCrunch and CNN

#tesla #roadster #flyingcar #engineering #howitworks

## Verified facts

Checked 2026-11-10.

- Tesla unveiled the new Roadster on 15 Oct 2026 at a SpaceX test site in Texas; it used thrusters to lift over a Cybercab, Cybertruck, Tesla Semi, Model Y and Model 3. [TechCrunch](https://techcrunch.com/2026/10/15/tesla-reveals-spacex-powered-roadster-that-flies-and-falls-with-style/), [CNN](https://www.cnn.com/2026/10/15/business/tesla-unveils-what-it-says-is-a-flying-car)
- Engineering VP Lars Moravy: 10 thrusters 'connected to 600 liters of compressed air'; the Thrust trim has 'rear-mounted cold-gas thrusters', the Rocket trim '10 cold-gas thrusters positioned around the car'. [TechCrunch](https://techcrunch.com/2026/10/15/tesla-reveals-spacex-powered-roadster-that-flies-and-falls-with-style/)
- Moravy also claimed over 80 kN of thrust (not in the script). [Drive Tesla Canada](https://driveteslacanada.ca/?p=126178)
- Performance trim: 'multi-mode suction system'; the car hung upside down from a ledge held by fan suction. [TechCrunch](https://techcrunch.com/2026/10/15/tesla-reveals-spacex-powered-roadster-that-flies-and-falls-with-style/), [KUTV](https://kutv.com/news/nation-world/flying-cars-are-real-elon-musk-tesla-debuts-new-roadster-dramatic-fashion-ramp-spacex-thruster-texas-0-to-60-mph-second-ramp-performance-thrust-invite-only-reservation-flight-technology)
- Production planned for 2028; flying features not approved for public roads; no price given. [CNN](https://www.cnn.com/2026/10/15/business/tesla-unveils-what-it-says-is-a-flying-car), [Star-Advertiser](https://www.staradvertiser.com/2026/10/16/breaking-news/tesla-unveils-roadster-with-thrusters-targets-2028-production/)
- Cold-gas thrusters push by Newton's third law, the same way spacecraft attitude thrusters work. General physics; [NASA Glenn, Newton's third law](https://www.grc.nasa.gov/www/k-12/airplane/newton3.html)
- Verify list re-checked 2026-11-10 before the final render:
  - 600 L and ten nozzles: TechCrunch quotes Moravy (Tesla's engineering VP), "10 thrusters connected to 600 liters of compressed air"; Drive Tesla Canada: two tanks, 600 L combined, "10 nozzles". The "two main thrusters" report is the outlier. Kept as scripted.
  - Fan on the jump car: MercoPress says the demo car "uses two systems", suction fans under the chassis plus the compressed-air thrusters; TechCrunch says the demo used "high-powered fans and thrusters". Kept as scripted. [MercoPress](https://en.mercopress.com/2026/10/18/tesla-s-new-roadster-uses-compressed-air-and-fans-to-jump-and-drive-upside-down)
  - Five cars: TechCrunch lists a Cybercab, Cybertruck, Tesla Semi, Model Y and Model 3. Kept as scripted.
- Dropped: '27 ft jump' and '0-60 in 0.81 s' (single-source or company-only numbers that sources disagree on).
