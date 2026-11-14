---
id: 35
slug: robotaxi-sensors
title: "How a robotaxi sees"
topic: "robotaxi"
format: E
category: "Aviation & engineering"
subcategory: "Cars"
week: 8
date: 2026-12-24
status: scripted
hook_formula: 3
hook_score: 81.4
question_score: 62.2
fit: high
fit_why: "car on a city street with visible sensors"
hook: "Nobody tells you a robotaxi uses three kinds of eyes."
source: "Waymo, A suite of sensors (support page); Waymo 6th-gen Driver coverage (Ward's Auto, Automotive World)"
verify:
  - "300 m lidar range is from Waymo's support page (5th-gen era); confirm it still applies to the 6th-gen Driver or say 'hundreds of meters'"
  - "13 cameras / 4 lidar / 6 radar and '42% fewer' are the 6th-gen figures from Aug 2024 coverage; confirm the fleet in service runs 6th gen on render day"
notes: "Three sensors, three jobs: lidar = distance/3D shape, cameras = colour and text, radar = speed and bad weather. Sensor fusion makes one picture."
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

# Idea 35: How a robotaxi sees

## Spine

| Part | Job |
|---|---|
| Question | how Waymo's robotaxi sees |
| Hook | it uses three kinds of eyes |
| Setup | it watches all the way around, not just forward like a driver |
| Mechanism | lidar maps in 3D up to 300 m; cameras read signs and lights; radar works in fog and measures speed; software blends all three |
| Payoff | the newest version: 13 cameras, 4 lidars, 6 radars, 42% fewer sensors |
| Answer | Mechanism: lidar, cameras and radar, blended into one picture |

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know how Waymo's robotaxi actually sees? | Question card over the Blender opener: a generic electric SUV (procedural, no Waymo branding) with a roof sensor dome, the dome amber. |
| Hook | Nobody tells you a robotaxi uses three kinds of eyes. | Blender hook: camera rises to the roof dome; three small sensor icons pop beside it on 'three kinds of eyes'. |
| Setup | A Waymo robotaxi watches all the way around, not just forward like you. | 2D: the robotaxi from above; on 'all the way around' a ring sweeps around it (amber); on 'forward' a narrow forward cone (faint) shows what a driver sees. Parallax + dust. |
| Mechanism | Lidar fires laser pulses and times the bounce, building a 3D map up to 300 meters away. Cameras read what lidar can't, like a stop sign or the color of a traffic light. Radar uses radio waves, so it still works in fog, and it measures how fast things are moving. Software blends all three into one picture. | Blender + 2D overlay: wide on the car at a junction; laser pulse lines out and back on 'laser pulses' (amber), a point-cloud of the street fades in on '3D map', on screen "300 m (984 ft)"; camera view frame with a stop sign and traffic light on 'cameras' (light amber); fog rolls in and radar arcs go through it on 'fog', a speed arrow on a moving car on 'how fast'; three layers merge into one picture on 'blends'. |
| Payoff | The newest version uses 13 cameras, 4 lidars and 6 radars. That's 42% fewer sensors than the last one. | 2D chart: icon rows 13 / 4 / 6 counting up; a before/after bar on '42% fewer', the 'after' bar amber. |
| Congrats | Congrats, you just learned how a robotaxi sees. | Congrats card: teal check + chime (template). |
| CTA | Follow for how things actually work. | Logo + tagline card. |

## Cold read

About: Waymo's robotaxi
Asks: how it sees
Answer: lidar, cameras and radar each cover what the others miss, and software blends them into one picture

## Notes

- Hooks scored: #3 "Nobody tells you a robotaxi uses three kinds of eyes." 81.4 STRONG (picked); #20 "You don't need eyes to see in fog. Radar does." 77.8; #26 "A Waymo sees 300 meters in every direction." 50.6.
- Question cards scored: "Do you know how Waymo's robotaxi actually sees?" 62.2 (picked); "Do you know how a robotaxi actually sees 300 meters?" 62.2; "Do you know how a robotaxi actually sees?" 45.0.
- Hook title: "Three kinds of eyes", highlight "Three".
- Alternative home: Everyday tech > AI. Kept in Cars with the other car ideas.
- World: the `city` world (junction).
- Units: 300 m = 984 ft.

## Caption

A robotaxi doesn't see with one kind of eye. It uses three. Save this before your first ride in one.

Lidar fires laser pulses and times the bounce to build a 3D map, up to about 300 meters (984 ft) away. Cameras read what lidar can't, like stop signs and the color of a traffic light. Radar uses radio waves, so it still works in fog, and it measures how fast things are moving. Software blends all three into one picture.

Waymo's newest version uses 13 cameras, 4 lidars and 6 radars, 42% fewer sensors than the one before.

Source: Waymo; Ward's Auto

#waymo #selfdrivingcars #robotaxi #lidar #howitworks

## Verified facts

Checked 2026-11-10.

- Lidar measures size and distance of objects 360 degrees around the vehicle 'up to 300 meters away'; cameras read signs and traffic-light colour but fog can limit them; radar uses microwaves, sees through fog and mist, and measures speed and direction. [Waymo support, A suite of sensors](https://support.google.com/waymo/answer/9190838), [Waymo, A fog blog](https://waymo.com/blog/2021/11/a-fog-blog/)
- 6th-gen Waymo Driver: 13 cameras, 4 lidar, 6 radar plus audio receivers; 42% fewer sensors than 5th gen (29 cameras, 5 lidar, 6 radar). [Ward's Auto](https://www.wardsauto.com/news/archive-auto-waymo-6th-generation-driver-autonomous-driving-hardware-robotaxi-lidar-ai/725519/), [Automotive World](https://www.automotiveworld.com/news/waymos-6th-gen-driver-goes-live-with-42-fewer-sensors/)
- Fully driverless operation with the 6th-gen Driver began in Feb 2026. [Electrek](https://electrek.co/2026/02/12/waymo-begins-fully-autonomous-ops-with-6th-gen-driver-targets-1m-weekly-rides/)
