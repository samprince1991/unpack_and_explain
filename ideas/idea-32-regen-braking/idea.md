---
id: 32
slug: regen-braking
title: "How braking charges an electric car"
topic: "braking"
format: E
category: "Aviation & engineering"
subcategory: "Cars"
week: 7
date: 2026-12-18
status: scripted
hook_formula: 3
hook_score: 78.6
question_score: 62.2
hook: "Nobody tells you braking gives an electric car back 32% in the city."
source: "U.S. DOE / EPA, fueleconomy.gov: Where the energy goes, electric cars"
verify:
  - "The 32% / 6% figures are fueleconomy.gov estimates (based on a 2012 Nissan Leaf, EPA test cycles) as a share of the energy from the grid. Keep 'estimates'; don't present them as true for every EV"
notes: "Motor = generator in reverse. Lifting off / braking runs it as a generator: current to the battery, drag slows the car. Gains are big in the city (lots of braking), tiny on the highway."
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

# Idea 32: How braking charges an electric car

## Spine

| Part | Job |
|---|---|
| Question | how braking saves 32% of energy |
| Hook | braking gives an electric car back 32% in the city |
| Setup | with normal braking, speed turns into heat and is lost |
| Mechanism | the motor works both ways: when the wheels turn it, it becomes a generator, sends current back to the battery, and that drag slows the car |
| Payoff | about 32% in city traffic, about 6% on the highway (US DOE) |
| Answer | Mechanism: the motor becomes a generator, so slowing down charges the battery |

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know how braking actually saves 32% of energy? | Question card over the Blender opener: a generic electric hatchback (procedural) at a city crossing, brake disc glowing, the motor amber in an X-ray view. |
| Hook | Nobody tells you braking gives an electric car back 32% in the city. | Blender hook: X-ray view through the wheel to the motor; arrows run from the wheel back to the battery (amber) on 'back'. |
| Setup | With normal braking, the brakes squeeze the wheels and turn your speed into heat. That energy is gone. | 2D line art: a brake pad clamps a disc on 'squeeze', heat waves rise on 'heat' (amber), then fade on 'gone'. |
| Mechanism | An electric motor works both ways. Feed it power, and it spins the wheels. Let the wheels spin it, and it becomes a generator. So when you lift off the pedal, the wheels push current back into the battery, and that drag is what slows you down. | Blender cutaway: wide; close on the motor on 'electric motor' (amber); arrows battery to wheel on 'spins the wheels'; arrows reverse wheel to battery on 'generator'; pedal lifts on 'lift off the pedal'; battery level ticks up on 'back into the battery'; car slows, speed lines shorten on 'slows you down'; wide. |
| Payoff | In city traffic, the U.S. Department of Energy estimates that adds back about 32%. On the highway, it's about 6%. | 2D chart: two bars, city 32% (amber) and highway 6%, on screen "32%" and "6%"; small 'stop-go' squiggle above city, a straight line above highway. |
| Congrats | Congrats, you just learned how braking charges an electric car. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Cold read

About: braking in an electric car
Asks: how braking saves 32% of energy
Answer: the motor runs as a generator, so slowing down charges the battery instead of making heat; about 32% in the city

## Notes

- Hooks scored: #3 "Nobody tells you braking gives an electric car back 32% in the city." 78.6 STRONG (picked); #3 "Nobody tells you your electric car's brakes are a generator." 52.2; #20 "You don't need a plug to charge an electric car a little." 48.6.
- Question cards scored: "Do you know how braking actually saves 32% of energy?" 62.2 (picked); "Do you know how braking charges an electric car?" 28.2.
- Hook title: "Brakes that charge", highlight "charge".
- World: needs a `city` street world (shared with 29/36 if built as one city).

## Caption

An electric car gets energy back every time it slows down. Save this if you drive one, or you're thinking about it.

The motor works both ways. Power in, and it spins the wheels. Let the wheels spin it, and it becomes a generator. When you lift off the pedal, the wheels push current back into the battery, and that drag is what slows you down.

In city traffic, the U.S. Department of Energy estimates this adds back about 32% of the energy. On the highway, where you barely brake, it's about 6%.

Source: fueleconomy.gov (U.S. DOE / EPA)

#electriccar #ev #regenerativebraking #engineering #howitworks

## Verified facts

Checked 2026-11-10.

- fueleconomy.gov 'Where the energy goes: electric cars' estimates net regenerative braking at 32% (city), 6% (highway), 22% (combined) of grid energy. [fueleconomy.gov](https://www.fueleconomy.gov/feg/atv-ev.shtml)
- Same page: EV drive systems lose 15-20% of energy versus 64-75% for a gasoline engine. [fueleconomy.gov](https://www.fueleconomy.gov/feg/atv-ev.shtml)
- An electric motor run backwards works as a generator (general physics, electromagnetic induction). [U.S. DOE AFDC, how all-electric cars work](https://afdc.energy.gov/vehicles/how-do-all-electric-cars-work)
