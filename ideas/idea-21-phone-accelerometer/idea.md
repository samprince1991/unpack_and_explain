---
id: 21
slug: phone-accelerometer
title: "How your phone knows which way is up"
format: E
category: "Everyday tech"
subcategory: "Devices"
week: 5
date: 2026-11-08
status: posted
link: "https://www.instagram.com/reel/DfgmpugIbXy"
hook_formula: 3
hook_score: 52.2
question_score: 62.2
hook: "Nobody tells you your phone hides a weight on springs."
source: "STMicroelectronics; capacitive MEMS accelerometer patent US6910379; Android developer docs"
verify:
  - "Exact proof-mass size in a specific phone sensor (no public spec found; say 'smaller than 1 mm (0.04 in)', not a precise figure)"
  - "'2-millimeter chip' is spoken without 'about': the source says the package is about 2 x 2 x 1 mm, and ST's figure is not specific to one phone"
notes: "MEMS accelerometer: a silicon proof mass on springs between comb fingers; tilt or shake moves it, the capacitance change becomes a number. Great exploded-view 3D (chip > die > comb)."
metrics:  # fill in after posting
  views: 126  # as of 2026-11-09 (insights export)
  reach: 121
  nonfollower_pct: null  # % of reach from non-followers
  hold_3s: null  # % of viewers still watching at 3 s
  watch_pct: null  # average watch time, % of video length
  likes: 0
  comments: 0
  shares: 0
  saves: 0
  follows: 0
---

# Idea 21: How your phone knows which way is up

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know what a 2-millimeter chip actually hides? | Question card (template) over the Blender opener: the chip in close-up. Topic word: "chip". |
| Hook | Nobody tells you your phone hides a weight on springs. | Blender hook: camera goes from the phone to the chip, then the lid lifts off. The weight turns amber on 'weight'. |
| Setup | Turn your phone sideways and the screen follows. That weight is how it knows. | 2D line art: a phone rotates and its screen follows. Label: "2 mm (0.08 in) chip, weight under 1 mm (0.04 in)". |
| Mechanism | The weight has tiny comb fingers, between fingers that don't move. Tilt your phone and gravity drags it slightly. The gaps change, so the electric charge they hold changes, and the chip turns that into a number. It does this in three directions. Together, those numbers point at the ground. | Blender mechanism: wide on the die; close-ups on the weight and the fixed fingers; on 'tilt' the die tilts and on 'drags' the weight slides, springs stretching; on 'gaps' a close-up as the gaps narrow, with 0.26 g on 'number'; wide and upright on 'three' as three arrows appear; the down arrow turns amber on 'ground'. |
| Payoff | Up is just the other way. Drop your phone, and the weight stops tugging its springs. All three numbers fall to nearly zero. | 2D: the arrow flips to point up. The phone falls, and three bars (no invented figures) drop to almost nothing, with the key bar amber. |
| Congrats | Congrats, you just learned how a tiny chip finds up. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Notes

- Hooks scored (hookscore.py): #3 "Nobody tells you your phone hides a weight on springs." 52.2 OK, chosen because it follows straight on from the question. "Nobody tells you a 2-millimeter chip in your phone hides a weight on springs." 75.7 STRONG, rejected: it says "2-millimeter chip" twice in five seconds and takes the script to about 130 words and 52 s. "1-millimeter weight" scored 80 but breaks the verify rule. Question card 62.2 (9 words).
- Beat sheet at 150 wpm: about 125 words, ~50 s. Beats over 4 s are covered by visual changes every 2 s.
- /ig-human (suggestions, not applied): BURSTINESS 23.9 (advisory on our even sentences), SPECIFICITY 34.5. Human score 48 FLAGGED, no artefacts to remove.
- "Point at the ground" is strictly true only when the phone is held still, because movement also changes the reading. Left out of the script for simplicity.
- On-screen "0.26 g" is worked out, not sourced: the die tilts 15 degrees on screen, and sin(15 degrees) = 0.26 g along that axis. "≈ 0 g" in the payoff is the free-fall reading (ST DT0100).
- 3D: procedural model `mems-accelerometer` (`blender/models/mems_accelerometer.py`, license own), built from how real parts are made, but not a copy of one specific chip. Not to scale: the chip is drawn about a quarter of the phone's width, since it would be invisible at true scale. Simplified so the weight stays visible: the silicon cap is left off, and the control chip sits under the MEMS die (in the ST part we checked, it sits on the cap). The metal lid is a style choice, not checked against a source. The bars in the payoff have no scale or figures.

## Caption

Save this for the next time your screen flips while you're lying in bed. That's a tiny weight on springs doing its job.

The part is called an accelerometer. It's a MEMS chip about 2 mm (0.08 in) wide, with a silicon weight smaller than 1 mm (0.04 in) hanging inside it.

When you tilt your phone, gravity moves the weight a tiny distance. The gaps between its comb fingers and the fixed ones change, and the chip reads that as a number on each of three axes. That's how your phone knows which way is up and when to rotate the screen.

In free fall the readings drop to nearly zero, because the weight stops pulling on its springs.

Source: STMicroelectronics, patent US6910379, Android developer docs

#accelerometer #MEMS #smartphone #howitworks

## Verified facts

Checked 2026-11-06.

- Most phone accelerometers are capacitive MEMS: a silicon proof mass hangs on tiny springs, and its comb fingers sit between fixed fingers. When the mass moves, the gap changes, so the capacitance changes, and the chip turns that into a number. [patent US6910379](https://patents.google.com/patent/US6910379)
- The whole sensor package is about 2 x 2 x 1 mm (0.08 x 0.08 x 0.04 in). [STMicroelectronics](https://www.st.com/en/mems-and-sensors/accelerometers.html)
- A published research device has a 750 x 560 µm proof mass and 120 µm long, 4 µm wide fingers, so 'smaller than 1 mm' is a safe way to say it. Phone parts aren't published. [Silicon-on-glass accelerometer paper](https://pure.bit.edu.cn/en/publications/a-micromachined-silicon-on-glass-accelerometer-with-an-optimized-/)
- A tilt moves the mass only a tiny distance (popular sources say nanometres to a fraction of a micrometre). Secondhand, so don't put a number on screen.
- X and Y usually use in-plane combs; Z uses a tilting mass or plates under it. Layouts differ between makers.

Checked 2026-11-08.

- The accelerometer reports acceleration along the device's x, y and z axes, including the force of gravity. Android also has a separate gravity sensor, typically used to work out the device's orientation. [Android developer docs](https://developer.android.com/develop/sensors-and-location/sensors/sensors_motion)
- In free fall, acceleration measured along all axes goes to zero, which is how ST's sensors recognize a fall. [ST design tip DT0100](https://www.st.com.cn/resource/en/design_tip/dt0100-setting-up-freefall-recognition-with-sts-mems-accelerometers-stmicroelectronics.pdf)
- Real parts read slightly above zero (an ST engineer suggested a threshold of about 312 mg), so say 'nearly zero'. Forum source, so don't put the figure on screen. [ST community](https://community.st.com/t5/mems-sensors/orientation-and-movement-values-in-lis2dw12-accelerometer/td-p/175385)
- The iPhone 4's ST LIS331DLH is an LGA package with two chips, a control chip and a MEMS die. The control chip sits on the MEMS cap and is wire bonded to the die and the package; other makers put the two side by side. Blog teardown from 2012, used only to shape the 3D model. [MEMS teardown](https://cimbu.blogspot.com/2012/07/motion-sensing-in-iphone-4-mems.html)
- Proof masses are perforated with etch holes, partly to reduce air damping, and suspension springs are often folded beams. From a search summary of MEMS papers and patents, not checked against one specific paper, so it's used only to shape the 3D model and isn't stated in the script.
