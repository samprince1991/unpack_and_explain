---
id: 34
slug: f1-upside-down
title: "Could an F1 car drive upside down"
topic: "F1 car"
format: E
category: "Aviation & engineering"
subcategory: "Cars"
week: 8
date: 2026-12-22
status: scripted
hook_formula: 3
hook_score: 70.0
question_score: 62.2
fit: high
fit_why: "F1 car in a tunnel, recognisable at frame 0"
hook: "Nobody tells you an F1 car could drive on the ceiling at 210 km/h."
source: "NASA Glenn, lift equation; Planet F1; University of Leicester Physics Special Topics"
verify:
  - "210 km/h (130 mph) is a student-journal estimate (University of Leicester Physics Special Topics, Monaco tunnel model, 58.7 m/s); others range 130-260 km/h. Either keep it and show the source on screen, or change the hook to 'at about 200 km/h' with Planet F1 as the source"
  - "'Nobody has ever tried': no known attempt found; re-check before rendering"
notes: "Wings are inverted aerofoils; floor makes most of the downforce. Downforce grows with speed squared, so above some speed it exceeds the car's weight, which in theory lets it stick to a ceiling. Never done."
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

# Idea 34: Could an F1 car drive upside down

## Spine

| Part | Job |
|---|---|
| Question | how two wings hold an F1 car down |
| Hook | an F1 car could drive on the ceiling at 210 km/h |
| Setup | its wings are plane wings upside down, so they push down |
| Mechanism | faster air under the wings lowers the pressure and presses the car into the track; the floor sucks too; double the speed, four times the push; fast enough, more than its weight |
| Payoff | so on a ceiling the air could hold it up; nobody has tried |
| Answer | Mechanism: upside-down wings lower the pressure under them and press the car down |

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know how 2 wings actually hold an F1 car down? | Question card over the Blender opener: a generic modern open-wheel race car (procedural, no team livery) in a tunnel, the front and rear wings amber. |
| Hook | Nobody tells you an F1 car could drive on the ceiling at 210 km/h. | Blender hook: the camera rolls 180 degrees until the car is on the tunnel ceiling; on screen "210 km/h (130 mph)". |
| Setup | An F1 car has wings too, but upside down. A plane's wing lifts, and flipped over it pushes down instead. | 2D: the F1 car in side view; on 'upside down' its front wing profile flips over; on 'pushes down' arrows press down from the wing into the track (amber). Parallax + dust. |
| Mechanism | Air rushes faster under them, the pressure drops, and the car is pressed into the track. The floor sucks it down too. Double the speed, and that push gets four times stronger. Fast enough, and it beats the car's own weight. | Blender: wide; close on the rear wing on 'wings' with airflow lines, faster lines underneath; pressure gauge drops on 'pressure there drops'; arrows press down on 'pressed into the track'; close on the floor on 'floor' (amber), arrows under it; 2D chart overlay on 'Double the speed': a curve with 1x at v and 4x at 2v; weight arrow and downforce arrow, downforce grows past it on 'bigger than the car's own weight'. |
| Payoff | So on a ceiling, the air could hold it up. The catch is getting up there at full speed. Nobody has ever tried. | Blender: the car on the tunnel ceiling, downforce arrow up (amber) on 'hold it up'; a question mark on the ramp up to the ceiling on 'catch'. |
| Congrats | Congrats, you just learned how downforce works. | Congrats card: teal check + chime (template). |
| CTA | Follow for how things actually work. | Logo + tagline card. |

## Cold read

About: an F1 car's downforce
Asks: how two wings hold an F1 car down
Answer: they're upside-down wings; faster air underneath lowers the pressure and presses the car down, more than its own weight at speed

## Notes

- Hooks scored: #3 "Nobody tells you an F1 car could drive on the ceiling at 210 km/h." 70.0 STRONG (picked); #3 "Nobody tells you an F1 car's wings are upside down." 52.2; #23 "At 210 km/h, an F1 car could drive upside down." 47.6.
- Question cards scored: "Do you know how 2 wings actually hold a car down?" 62.2 (picked); "Could an F1 car really drive upside down?" 30.0.
- Hook title: "Driving on the ceiling", highlight "ceiling".
- Pairs with 28 (Roadster hung upside down by fan suction) and 30 (fan car). Space them apart.
- World: the `track` world (tunnel section).
- Units: 210 km/h = 130 mph.

## Caption

In theory, a Formula 1 car could drive across a ceiling. Save this for the next race weekend.

Its wings are plane wings flipped upside down. Air rushes faster under them, the pressure there drops, and the car is pressed into the track. The floor does the same job. Double the speed and that push gets about four times stronger, so at some point it's bigger than the car's own weight.

One student estimate puts that at about 210 km/h (130 mph). The hard part is getting onto the ceiling at full speed, and nobody has tried.

Source: NASA Glenn; University of Leicester Physics Special Topics

#f1 #formula1 #downforce #engineering #howitworks

## Verified facts

Checked 2026-11-10.

- Lift (and downforce) = 1/2 x density x speed^2 x area x coefficient, so it scales with speed squared. [NASA Glenn, lift equation](https://www.grc.nasa.gov/www/k-12/airplane/lifteq.html)
- Minimum theoretical speed to drive upside down in the Monaco tunnel model: 58.7 m/s (about 211 km/h); real driving would need more for grip. [University of Leicester, Physics Special Topics (PDF)](https://journals.le.ac.uk/index.php/pst/article/download/5066/4984/19677) (student journal; text read via search summary only)
- Planet F1: engineers estimate an average F1 car at about 200 km/h makes downforce equal to its own weight. [Planet F1](https://www.planetf1.com/features/revealed-can-f1-car-drive-upside-down)
