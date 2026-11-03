---
id: 10
slug: undersea-cables
title: "How undersea cables carry the internet"
format: E
category: "Everyday tech"
subcategory: "Internet"
week: 3
date: 2026-11-17
status: rendered
hook_formula: 3
hook_score: 81.6
question_score: 62.2
hook: "Nobody sees the 1.5 million kilometers of cable your internet runs on."
source: "TeleGeography Submarine Cable FAQ (2026); International Cable Protection Committee"
verify:
  - "Repeater spacing 50-80 km (engineering sources, not TeleGeography FAQ)"
  - "Lasers flash billions of times a second (modern line rates are tens of gigabaud)"
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

# Idea 10: How undersea cables carry the internet

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know how your internet actually crosses the Atlantic? | Question card (template) over the Blender opener: a cable segment lying on the seabed, the fiber core amber. |
| Hook | Nobody sees the 1.5 million kilometers of cable your internet runs on. | Blender hook: camera glides low along the cable on the seabed, the core glows amber on 'cable'. 930,000 mi conversion under the title. |
| Setup | Your messages to another continent almost never go to space. They dive under the ocean. | 2D SeaSection (new style): side view of an ocean between two coasts, phone on one, laptop on the other; a dashed route through a satellite draws, then fades on 'space'; on 'dive' the cable draws down the slope and along the seabed, an amber pulse travels it. Parallax + dust. |
| Mechanism | The cable is as wide as a garden hose, with glass fibers as thin as a hair. A laser flashes light down each fiber, billions of times a second. Every 50 to 80 kilometers, a repeater boosts the light. On the far shore, it turns back into data. | Blender mechanism: the cable explodes into its layers (sheath, steel armour, copper, tube), the fibers amber on 'fibers'; collapse, an amber pulse flows along the fiber on 'laser', reaches a repeater on 'repeater' (it becomes the key, 30-50 mi label), then flows on to the shore end on 'shore'. |
| Payoff | Anchors and fishing gear break these cables about 200 times a year. Your data just takes another cable until a ship fixes it. | 2D SeaSection: a ship drags its anchor (amber) along the seabed until the cable snaps on 'break'; on 'another' the ship fades and an amber pulse runs the second cable instead; on 'ship' a repair ship parks over the break. |
| Congrats | Congrats, you just learned how the internet crosses oceans. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Notes

- Facts checked 2026-11-02 against the TeleGeography Submarine Cable FAQ: more than 600 active and planned cables; over 1.5 million km in service (early 2026; ~930,000 mi); most of a cable's length is about as wide as a garden hose; fibers about the diameter of a human hair; lasers fire down the fibers; satellites carry a very small share of international traffic (0.37% of US international capacity); about 200 faults a year (ICPC), about two-thirds from fishing vessels and dragged anchors; operators spread traffic across several cables while one is repaired.
- Repeater spacing: 50 km (arXiv 1806.01945), ~60 km (US patent 9893834), 60-80 km (SubTel Forum). Repeaters amplify the light directly (erbium-doped fiber amplifiers, powered from shore).
- The old idea hook ("Most intercontinental data...") needed a percentage the FAQ doesn't give, so the script avoids it.
- 3D: procedural model `subsea-cable` (`blender/models/subsea_cable.py`, license own): stepped cutaway jacket > armour > copper > tube > fibers, a repeater and a shore ramp.
- Scene styles: posts 3 and 20 used Gauge, GlidePath, ChatBox, CodeBlock, CycleDiagram, PhoneFrame. New style `styles/SeaSection` (ocean side view) for setup and payoff.

## Caption

Save this for when someone says your internet comes from satellites. It's 1.5 million km of undersea cables.

That's how the internet works between continents. Almost all of that traffic runs along the ocean floor, through more than 600 submarine cables.

Each one's about as wide as a garden hose. Inside, a laser flashes light down glass fibers as thin as a hair, and repeaters on the seabed boost it every 50 to 80 km.

They break about 200 times a year, mostly from ship anchors and fishing gear. You don't notice, because your data reroutes to another cable while a repair ship fixes the break.

Source: TeleGeography

#underseacables #submarinecables #internet #howitworks
