---
id: 26
slug: bulbous-bow
title: "Why big ships have a bump on their nose"
format: E
category: "Aviation & engineering"
subcategory: "Ships"
week: 6
date: 2026-12-08
status: rendered
hook_formula: 3
hook_score: 76.4
question_score: 62.2
hook: "You've never noticed the bump that saves ships up to 14% fuel."
source: "FAO bulbous bow study; Force Technology; Wallenius Wilhelmsen; Clipper Group (Marine Log)"
verify:
  - "140 tonnes is the upper end for Maersk's big container-ship bows (Maersk via Ships Monthly); question card says it as a question, keep the source"
notes: "Bulbous bow makes its own wave just ahead of the bow wave, out of phase, so the two partly cancel and the hull pushes less water. Strong side-view 3D with the two waves."
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

# Idea 26: Why big ships have a bump on their nose

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know why ships actually have a 140-tonne bump? | Question card (template) over the Blender opener: low three-quarter view of a ship's bow at the waterline, the bulb below the surface amber. |
| Hook | You've never noticed the bump that saves ships up to 14% fuel. | Blender hook: camera starts above the water on the bow, then dips below the waterline and finds the bulb, which turns amber on 'bump'. |
| Setup | Every ship shoves water aside. It piles up into a wave at the bow, and making that wave burns fuel. | 2D, new style `styles/WaveProfile` (side view of a hull at the waterline, the water line drawn as a moving curve): a plain bow with no bulb pushes forward; on 'piles' the water line bunches up into a crest at the bow (amber on 'wave'); on 'fuel' a LineIcon fuel gauge needle drops. Parallax + dust. |
| Mechanism | So shipbuilders add a bulb below the waterline, ahead of the bow. It makes its own wave, out of step with the bow wave. Where one rises, the other dips. They partly cancel, so the ship drags a smaller wave. | Blender mechanism: wide on the bow and water surface; focus on the bulb on 'bulb'; on 'own wave' the bulb's wave ribbon rises (amber); on 'bow wave' the bow-wave ribbon is the key; on 'rises' / 'dips' the two ribbons move opposite ways; on 'cancel' they collapse into one low ribbon; wide on 'smaller wave', amber off. |
| Payoff | But it only works at the speed it was built for. When Maersk slowed its ships, it swapped the old bulbs for new ones. | 2D WaveProfile + Gauge: a speed gauge needle (amber) on 'speed' drops on 'slowed'; on 'swapped' the long old bulb slides away and a new, shorter bulb settles into place. |
| Congrats | Congrats, you just learned why ships have a bump. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Notes

- Hooks scored (hookscore.py): #3 Nobody Tells You style "You've never noticed the bump that saves ships up to 14% fuel." 76.4 STRONG; #23 Statistic "Up to 14% of a ship's fuel is saved by one hidden bump." 61.9; #26 Superlative "The fastest way to save a ship 14% fuel is a bump." 40.4. Question card 62.2.
- Beat sheet at 150 wpm: 124 words (beats.py count), ~49.6 s; tracker counts the words. Beats over 4 s are covered by visual changes every 2 s.
- 14% is a fishing-boat result (FAO), so the source line must show FAO during the hook. Big cargo ships: 6-8.5% (Wallenius Wilhelmsen, Clipper).
- Payoff source: Maersk designed its big container ships for about 25 knots; after slow steaming it replaced bows on several classes (Ships Monthly, Force Technology). CMA CGM built 22,500 TEU ships with no bulb at all for the same reason. [Ships Monthly](https://shipsmonthly.com/news/off-with-the-bulbous-bows), [Force Technology](https://forcetechnology.com/insights/cases/retrofitting-a-new-bulbous-bow)
- 3D: procedural model `bulbous-bow` (`blender/models/bulbous_bow.py`, license own): bow section of a hull, bulb, waterline plane, bow-wave ribbon, bulb-wave ribbon, combined low wave. Not the previous post's model.
- Scene styles: posts 10, 12, 20 used SeaSection, MythSwap, ShareGrid, ChatBox, CodeBlock, CycleDiagram, PhoneFrame. New `styles/WaveProfile` for setup and payoff (side view of a hull, not SeaSection's coast-to-coast ocean).
- /ig-human (suggestions, not applied): BURSTINESS 9 (advisory on our even sentences), VOICE 46.7 (few contractions). Human score 42 FLAGGED, mostly from burstiness.

## Caption

Save this for the next time you see a ship in dry dock. That round bump under the bow is a bulbous bow.

It's a classic bit of ship design. Every ship pushes up a wave at its bow, and making that wave burns fuel. The bulb sits below the waterline and makes its own wave, out of step with the bow wave, so the two partly cancel.

On a small fishing boat it cut fuel use by up to 14%. Big cargo ships report around 6 to 8.5%.

The catch is speed. A bulb doesn't do much away from the speed it was designed for, which is why Maersk replaced the bows on ships it started sailing slower.

Source: FAO, Wallenius Wilhelmsen, Force Technology

#bulbousbow #shipdesign #navalarchitecture #howitworks

## Verified facts

Checked 2026-11-06.

- How it works: the bulb pushes up its own wave just in front of the bow wave, out of step with it, so the two partly cancel and the ship spends less energy making waves. It only works well near the speed and draught it was designed for.
- Up to 14% less fuel: a fishing-boat project measured 14% at 7 knots, fully loaded. [FAO](https://fao.org/fileadmin/user_upload/responsiblefishing/docs/Bulbousbow_concept_and_design_PPT.pdf)
- On big cargo ships, a new bulb saved 6% on average on Wallenius Wilhelmsen's Aniara and 8.5% on a Clipper heavy-lift ship, and cut resistance 11.7% in a Force Technology retrofit. [Wallenius Wilhelmsen](https://www.walleniuswilhelmsen.com/news/a-step-forward-the-new-bulbous-bow-arrives), [Marine Log](https://www.marinelog.com/?p=5190), [Force Technology](https://forcetechnology.com/en/viden/cases/retrofitting-af-en-ny-bulb)
- Script tip: say 'up to 14%' only with the FAO source on screen, or use the cargo-ship range (6-8.5%) for big ships.
