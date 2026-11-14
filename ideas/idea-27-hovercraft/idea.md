---
id: 27
slug: hovercraft
title: "How a hovercraft floats on air"
topic: "a hovercraft"
format: E
category: "Aviation & engineering"
subcategory: "Ships"
week: 6
date: 2026-11-10
status: posted
link: "https://www.instagram.com/reel/DfjiHj8Ivbl"
hook_formula: 20
hook_score: 77.8
question_score: 62.2
fit: high
fit_why: "hovercraft on the coast world (posted: 1,379, 10.6x)"
hook: "You don't need strong air to lift an 11-tonne hovercraft."
source: "SR.N6 worked example (Wikipedia, Hovercraft); National Historic Ships UK; SR.N4 specifications"
verify:
  - "765 Pa (about 0.75% above atmospheric) for the 11-tonne SR.N6 is a rounded worked example on Wikipedia (W = 107 kN, A = 140 m2). Find a primary source (Hovercraft Museum, Saunders-Roe / BHC data) or keep 'Wikipedia' in the source line"
  - "'Up to 60 cars' is the SR.N4 Mk3 figure on Wikipedia; National Historic Ships lists The Princess Anne at up to 55 cars and 427 passengers. Say 'up to 60' only for the Mk3 class, or switch both lines to 'over 50 cars'"
notes: "Lift = cushion pressure x area. The air under the craft is under 1% above normal pressure, but it pushes on the whole underside at once, so it adds up to the full weight. The skirt traps the air; the fan only replaces what leaks out under it. Fits the sea world (hovercraft on water, needs a model with a waterline part)."
metrics:
  views: 1379  # as of 2026-11-13 (insights export)
  reach: 1236
  nonfollower_pct: null  # % of reach from non-followers
  hold_3s: null  # % of viewers still watching at 3 s
  watch_pct: null  # average watch time, % of video length
  likes: 12
  comments: 0
  shares: 3
  saves: 1
  follows: 1
youtube:  # YouTube Short; status/link/metrics above are Instagram
  date: 2026-11-10
  link: null  # paste the Shorts URL
  metrics:  # YouTube Studio > Analytics, fill in later
    views: null
    engaged_views: null
    stayed_pct: null  # "viewed vs. swiped away", % stayed
    watch_pct: null  # average percentage viewed
    likes: null
    comments: null
    shares: null
    subscribers: null  # subscribers gained
---

# Idea 27: How a hovercraft floats on air

## Spine

| Part | Job |
|---|---|
| Question | how a hovercraft can lift something as heavy as 60 cars |
| Hook | it does it with weak air: an 11-tonne craft rides on air barely above normal pressure |
| Setup | the problem: a hovercraft never touches the water, so nothing solid holds it up |
| Mechanism | a fan blows air under the hull, the skirt traps it; it pushes barely harder, but over the whole underside, so it adds up to the weight; air leaks out, so the fan never stops |
| Payoff | the same trick scales up to the 320-tonne SR.N4 that carried 60 cars across the Channel |
| Answer | Payoff: the same trapped-air trick, scaled up, carried up to 60 cars |

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know how a hovercraft actually lifts 60 cars? | Question card (template) over the Blender opener in the coast world (placement `sea`): low three-quarter view of a hovercraft on the water, spray ring around the skirt, the skirt amber. |
| Hook | You don't need strong air to lift an 11-tonne hovercraft. | Blender hook: the camera drops from the deck to the waterline and finds the gap under the skirt, the cushion glowing amber on 'air'. On-screen: "11 t (12 US tons)". |
| Setup | A hovercraft never touches the water. Nothing solid holds it up. | 2D: the side-view hovercraft over a water line; it lifts on 'touches' and the gap under the skirt turns amber; a soft pulse in the empty gap on 'solid'. World backdrop behind. |
| Mechanism | A fan blows air under the hull, and a rubber skirt traps it. That air pushes barely harder than the air outside. But it pushes on the whole underside, and over that much area, it adds up to the full weight. Air keeps leaking out under the skirt, so the fan never stops. | Blender mechanism, cutaway side view: wide on the craft; close on the lift fan on 'fan' (amber), air arrows flowing down; on 'skirt' the skirt is the key; on 'barely' a small pressure gauge appears with "+0.75% (765 Pa, 0.11 psi)" on screen; on 'whole underside' a grid of small arrows pushes up across the whole hull bottom (amber); on 'leaking' wisps escape under the skirt edge, the fan spins on; wide again at the end. |
| Payoff | The same trick scales up. The biggest ones weighed 320 tonnes and carried up to 60 cars across the English Channel. | 2D map style: Dover to Calais line draws on 'Channel'; a scale bar grows from the small craft to the big one on 'scales up'; on screen "SR.N4: 320 t (353 US tons)"; a row of car icons counts up to 60 on 'cars', the last car amber. |
| Congrats | Congrats, you just learned how a hovercraft floats. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Cold read

About: a hovercraft
Asks: how a hovercraft can lift 60 cars
Answer: a fan fills the space under the hull with air that a skirt traps; it pushes only a little harder than normal air, but over the whole underside, so it holds the full weight; the same trick, scaled up, carried 60 cars across the Channel

## Notes

- Hooks scored (hookscore.py): #20 Permission "You don't need strong air to lift an 11-tonne hovercraft." 77.8 STRONG; #3 Nobody Tells You "Nobody tells you the air holding up a hovercraft is barely pushing." 50.8; #23 Statistic "Air less than 1% above normal pressure lifts an 11-tonne hovercraft." 49.2; #26 Superlative "The biggest hovercraft carried 60 cars on a cushion of air." 44.0.
- Rewritten 2026-11-10 for one subject: the old card ("Do you know how air actually lifts 60 cars?") and setup (a boat, a car, then the hovercraft) put three vehicles in front of the viewer in 8 s. New card "Do you know how a hovercraft actually lifts 60 cars?" 62.2; new setup line 58.2. Earlier question cards scored: "Do you know how air actually lifts 60 cars?" 62.2; "Do you know how an 11-tonne hovercraft actually floats?" 62.2 (repeats the hook); "Do you know how a hovercraft actually floats?" 45.0.
- Hook title (hookText, 28 chars max): "Weak air lifts 11 tonnes", highlight "Weak".
- World: `coast` (built for this post). Placement `sea` for the opener, hook and mechanism (spray ring and cushion dip on the water); the backdrop behind the 2D setup and payoff shows the shore, which suits the beach payoff.
- Model: procedural `hovercraft` (`blender/models/hovercraft.py`, license own), modelled on a light open-cockpit rescue hovercraft the user shared: finger skirt (`skirt`), hull with a covered bow cowl (`hull`), bench (`seat`), one big fan (`fan`, spins about X) in a round duct (`duct`) behind a wire guard (`guard`), three rudder vanes (`rudders`), and appear-only `cushion` (key), `pushgrid` (arrows up on the hull bottom) and `leaks` (air escaping under the skirt). One fan does lift and thrust, so the mechanism's 'fan' beat focuses on `fan` and flows to `cushion`. Not the previous post's model.
- Scene styles: setup three-panel line art, payoff map + scale bar. Check against the last 3 posts before building.
- Units: 11 t = 12 US tons; 320 t = 353 US tons; 765 Pa = 0.11 psi.

## Caption

Save this for the next time a hovercraft slides up a beach. It rides on air that's only 1 to 3% above normal air pressure.

Here's how a hovercraft works. A fan blows air under the hull, and a rubber skirt traps it as an air cushion. On the small SR.N6, that cushion pushed less than 1% harder than the air around you.

It doesn't need to push hard. It pushes on the whole underside at once, and over that much area it adds up to the craft's full weight. Air keeps leaking out under the skirt, so the fan never stops.

The trick scales up. The SR.N4 weighed about 320 tonnes and carried cars across the English Channel from 1968 to 2000. Its fastest Dover to Calais crossing took 22 minutes, in 1995.

Source: AutoSpeed; SR.N6 worked example (Wikipedia, Hovercraft); National Historic Ships UK; Guinness World Records

#hovercraft #aircushion #engineering #howitworks

## Verified facts

Checked 2026-11-10.

- How it works: the pressure difference between the air under the hull and the air around it produces the lift, and the minimum cushion overpressure is simply weight divided by planform area (p = W/A). The cushion is only slightly above atmospheric pressure. [Wikipedia, Hovercraft](https://en.wikipedia.org/wiki/Hovercraft)
- SR.N6 worked example: W = 107 kN (about 10.9 t), A = 140 m2, so about 765 Pa, which is about 0.75% of normal air pressure (101.3 kPa). Rounded values; see `verify`. [Wikipedia, Hovercraft](https://en.wikipedia.org/wiki/Hovercraft)
- Typical designs run 1.2 to 3.3 kPa (25 to 70 lb/ft2), still only about 1 to 3% above atmospheric. [AutoSpeed, The Incredible Hovering Craft](https://autospeed.com.au/cms/a_113251/printArticle.html)
- The skirt: flexible fabric or rubber around the hull that contains the air. Early SR.N1 hovered only 9 in (23 cm) up, so waves hit the bow; a 4 ft (1.2 m) skirt let it climb over obstacles almost as high as the skirt. Air escapes under the edge, so the fan has to keep supplying it. [Wikipedia, Hovercraft](https://en.wikipedia.org/wiki/Hovercraft)
- SR.N4: Mk3 gross weight roughly 320 t, up to 60 cars and 418 passengers, four Proteus gas turbines driving steerable propellers on pylons, Channel service 1968 to 2000. [Wikipedia, SR.N4](https://en.wikipedia.org/wiki/SR.N4)
- The Princess Anne (SR.N4 Mk3, the last one left): up to 427 passengers and 55 cars; record Dover to Calais crossing of 22 minutes on 14 September 1995. [National Historic Ships UK](https://www.nationalhistoricships.org.uk/register/3548/srn4-princess-anne), [Guinness World Records](https://www.guinnessworldrecords.com/world-records/fastest-crossing-of-the-english-channel-by-hovercraft)
- History, not in the script: Cockerell's early-1950s test blew air into the gap between a coffee tin and a cat-food tin; the SR.N1 crossed the Channel on 25 July 1959. Sources disagree on the year of the tin test (1954 or 1955), so don't put a year on it. [Wikipedia, Christopher Cockerell](https://en.wikipedia.org/wiki/Christopher_Cockerell)
- Dropped: "a hovercraft has no brakes." Only hobbyist sources say it, and big craft slow down with reversible-pitch propellers, so it's too loose to say.
