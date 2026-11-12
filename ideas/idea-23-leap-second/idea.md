---
id: 23
slug: leap-second
title: "The leap second that crashed websites"
format: F
category: "Everyday tech"
subcategory: "Internet"
week: 5
date: 2026-12-03
status: idea
fit: low
fit_why: "abstract: time and software"
hook: "In 2012, one extra second broke Reddit for you."
source: "The Register, 2 July 2012; Google leap smear docs; CGPM 2026 (Scientific American, Euronews)"
verify:
  - "Read the BIPM text of the 28th CGPM resolution (secondary sources say Resolution 5, leap seconds end 20 May 2027)"
notes: "Clocks sync to atomic time; Earth's spin is slightly irregular, so a 61st second (23:59:60) gets inserted. A Linux timer bug made servers spin at 100% CPU. Why big tech now 'smears' the second, and why leap seconds stop in May 2027."
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

# Idea 23: The leap second that crashed websites

Not scripted yet. Add `## Script` and `## Caption` sections (see idea-02-gps) when it is.

## Verified facts

Checked 2026-11-06.

- A leap second was added at 23:59:60 UTC on 30 June 2012. A Linux kernel bug made servers livelock (CPUs spinning at full load doing nothing). Reddit, Mozilla, LinkedIn, Yelp, Foursquare and StumbleUpon were hit. [The Register](https://www.theregister.com/2012/07/02/leap_second_crashes_airlines/)
- Amadeus's Altea booking system went down for about an hour, and Qantas and Virgin Australia staff checked passengers in by hand. [The Register](https://www.theregister.com/2012/07/02/leap_second_crashes_airlines/)
- Why leap seconds exist: atomic clocks are steady, but Earth's spin isn't, so UTC got an extra second now and then to stay close to Earth time (UT1).
- Google's fix is the 'leap smear': it spreads the extra second over 24 hours (noon to noon UTC), so no clock ever shows 23:59:60. AWS does the same. [Google](https://developers.google.com/time/smear)
- New since we planned this: on 15 Oct 2026 the 28th CGPM voted to stop adding leap seconds from 20 May 2027 (the 2022 plan said 'by 2035'). Good payoff: the second that broke Reddit is being retired. [Scientific American](https://www.scientificamerican.com/article/the-leap-seconds-time-is-up-world-votes-to-stop-pausing-clocks/), [Euronews](https://www.euronews.com/next/2026/10/16/global-timekeeping-rules-change-leap-second-scrapped-from-2027)
