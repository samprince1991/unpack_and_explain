---
id: 37
slug: ev-cold-range
title: "Why electric cars lose range in the cold"
topic: "electric car"
format: E
category: "Aviation & engineering"
subcategory: "Cars"
week: 9
date: 2026-12-28
status: scripted
hook_formula: 3
hook_score: 52.2
question_score: 65.8
fit: medium
fit_why: "car fits, but the cause is battery chemistry"
hook: "Nobody tells you the heater eats an electric car's range."
source: "AAA, Feb 2019 EV temperature study; fueleconomy.gov, cold weather"
verify:
  - "'Warming the cabin is basically free' in a gas car: the engine's waste heat is used (fueleconomy.gov says gas engines lose 64-75% of energy as losses), but a gas car's range also drops in the cold. Fine as phrased; don't claim gas cars lose nothing"
  - "The AAA study is from Feb 2019 (2017-18 cars). Newer EVs with heat pumps may lose less; say 'AAA tested' with the year in the source line"
notes: "No waste heat in an EV, so cabin heat comes out of the driving battery (about two-thirds of the extra energy goes to heating, per DOE), and the battery itself performs worse in the cold. AAA: -41% at 20 °F with heat on, -12% with heat off."
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

# Idea 37: Why electric cars lose range in the cold

## Spine

| Part | Job |
|---|---|
| Question | why electric cars lose 41% in winter |
| Hook | the heater eats the range |
| Setup | it has no free heat: a gas engine's waste heat warms the cabin, an electric motor barely warms up |
| Mechanism | so the heat comes from the battery that drives the wheels, and a cold battery works worse too |
| Payoff | AAA: range dropped 41% at -7 °C with the heater on; warm it up while plugged in |
| Answer | Mechanism: the heater runs on the drive battery, and cold batteries work worse |

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know why electric cars actually lose 41% in winter? | Question card over the Blender opener: a generic electric hatchback (procedural) in a snowy car park at night, the battery glowing amber in an X-ray view. |
| Hook | Nobody tells you the heater eats an electric car's range. | Blender hook: X-ray through the dashboard to the heater; a line from the battery to the heater glows amber on 'heater'. |
| Setup | An electric car gets no free heat. A gas engine's waste heat warms the cabin. An electric motor barely warms up. | 2D: an electric car outline; on 'free heat' a thermometer icon at the cabin reads low; on 'gas engine' a faint inset engine with heat waves appears and fades; on 'motor' the car's motor turns amber with no heat waves. Parallax + dust. |
| Mechanism | So the heat has to come from the battery, the same battery that drives the wheels. On a freezing day, that heater can take a huge share of the charge. And the battery itself also works worse when it's cold. | Blender cutaway: wide; close on the battery on 'battery' (amber); two lines out, one to the wheels and one to the heater, the heater line thickens on 'huge share'; frost forms on the battery pack and its glow dims on 'works worse when it's cold'; wide. |
| Payoff | AAA tested five electric cars at minus 7 Celsius with the heater on. Range dropped 41%. Their tip: warm it up while it's still plugged in. | 2D chart: a range bar shrinks from 100 to 59 (amber) on '59', on screen "-7 °C (20 °F)" and "100 mi → 59 mi (161 → 95 km)"; a plug icon on 'plugged in'. |
| Congrats | Congrats, you just learned why electric cars lose range in the cold. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Cold read

About: electric cars in the cold
Asks: why electric cars lose 41% in winter
Answer: the cabin heater runs off the battery that drives the wheels, and the battery works worse in the cold; AAA measured a 41% drop

## Notes

- Hooks scored: #3 "Nobody tells you the heater eats an electric car's range." 52.2 OK (picked: the question card already carries the 41%); #20 "You don't need snow to cut your electric car's range by 41%." 81.4 but repeats the 41% from the question card; #23 "Turn on the heater, and an electric car loses 41% of its range." 37.6.
- Question cards scored: "Do you know why EVs actually lose 41% in winter?" 65.8 (picked); "Do you know why electric cars hate the cold?" 45.0.
- Hook title: "The heater eats range", highlight "heater".
- Timely for late December. World: needs a `snow` world (car park at night), or the `city` world with a snow pass.
- Units: -7 °C = 20 °F; 100 mi = 161 km; 59 mi = 95 km.

## Caption

In freezing weather, an electric car's heater can cost it 41% of its range. Save this before your next winter road trip.

A gas engine throws off so much waste heat that warming the cabin costs almost nothing. An electric motor barely gets warm, so the heat comes out of the same battery that drives the wheels, and the battery also performs worse in the cold.

AAA tested five electric cars at 20 °F (-7 °C). With the heater on, range dropped 41%, so a 100-mile car went about 59. Their tip: warm the car up while it's still plugged in.

Source: AAA (2019); fueleconomy.gov

#electriccar #ev #winterdriving #evrange #howitworks

## Verified facts

Checked 2026-11-10.

- AAA (7 Feb 2019): at 20 °F with HVAC on, average range fell 41%; a car rated for 100 miles would go about 59; at 95 °F with A/C, -17%; advice: pre-heat or cool while connected to the charger. [AAA Newsroom](https://newsroom.aaa.com/2019/02/cold-weather-reduces-electric-vehicle-range/)
- Five cars tested: 2018 BMW i3s, Chevrolet Bolt, Nissan Leaf, 2017 Tesla Model S 75D and VW e-Golf; heater off at 20 °F, range fell 12%. [KUTV / AAA](https://kutv.com/news/auto-matters/aaa-cold-weather-can-cut-electric-car-range-over-40-percent)
- DOE: 'About two-thirds of the extra energy consumed is used to heat the cabin'; 'Battery performance decreases in cold weather'; preheat while plugged in; seat warmers save energy. [fueleconomy.gov, cold weather](https://www.fueleconomy.gov/feg/coldweather.shtml)
- Gas engines lose 64-75% of their energy; EV drive systems 15-20%. [fueleconomy.gov](https://www.fueleconomy.gov/feg/atv-ev.shtml)
