---
id: 12
slug: cloud-myth
title: "Myth: 'Cloud storage is in the sky'"
format: Q
category: "Everyday tech"
subcategory: "Internet"
week: 3
date: 2026-11-20
status: rendered
hook_formula: 3
hook_score: 83.0
question_score: 62.2
hook: "Nobody tells you Amazon's cloud copies your files into 3 buildings."
source: "AWS Amazon S3 docs (data protection); IEA Energy and AI (2025)"
verify: []
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

# Idea 12: Myth: 'Cloud storage is in the sky'

## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know where the cloud actually sits on Earth? | Question card (template) over the Blender opener: a data-center building with the roof cut away, rows of server racks inside, one rack amber. |
| Hook | Nobody tells you Amazon's cloud copies your files into 3 buildings. | Blender hook: close on one data-center building, camera pulls back on 'copies' to reveal three buildings far apart on the ground; the first building amber. |
| Setup | Most people picture the cloud somewhere up in the sky. It's actually a warehouse full of computers. | 2D: a line-art cloud floats high in the visual region with a coral MYTH stamp on 'sky'; on 'warehouse' the cloud drops and redraws as a building outline, teal FACT stamp. Parallax + dust. |
| Mechanism | Upload a photo, and it races through cables to a data center. It's saved onto drives, in long rows of servers. Then copies go to at least two more buildings, kilometers apart. If one loses power, another still has your photo. | Blender mechanism: wide on the three buildings; an amber dot flows along the feed cable into the hall on 'races' and lands in a rack (close-up); focus on the drive sled (amber) on 'drives'; wide on 'Then'; amber dots flow to sites 2 and 3 on 'copies' / 'more' (label '≤ 100 km / 60 mi'); amber off on 'If'; close-up on site 2 (amber) on 'power'; wide on 'has'. |
| Payoff | All those buildings need power. Data centers used about 1.5% of the world's electricity in 2024. Quite a power bill for something in the sky. | 2D: a 100-square grid fills in neutral; on '1.5%' one and a half squares turn amber with a 1.5% counter; on 'sky' the cloud from the setup floats back in, now with a plug cable hanging down to the ground. |
| Congrats | Congrats, you just learned where the cloud really lives. | Congrats card: teal check + chime (template). |
| CTA | Follow Unpack and Explain for how things actually work. | Logo + tagline card. |

## Notes

- Facts checked 2026-11-04. AWS S3 docs (Data protection in Amazon S3): S3 Standard redundantly stores objects on multiple devices across a minimum of three Availability Zones; AZs are physically separated by many kilometers but within 100 km (60 mi) of each other; each AZ is one or more discrete data centers, so "at least 3 buildings" holds. IEA Energy and AI (2025), executive summary: data centres used around 1.5% of the world's electricity in 2024 (415 TWh).
- The "3 buildings" fact is Amazon S3 Standard specifically (not every storage class: S3 One Zone keeps one AZ), so the hook names Amazon and the caption says S3. Consumer apps (iCloud, Google Photos) run on their own or rented clouds with similar replication; the script doesn't claim specifics for them.
- Q format: MYTH stamp on 'sky' in the setup (the myth is stated there, the hook carries the surprising fact because "Myth: ..." hooks scored 37-51), FACT stamp on 'warehouse'.
- Callback to post 10: "races through cables" (undersea cables reel).
- 3D: new procedural model `data-center` (`blender/models/data_center.py`, license own): open hall (roof and front wall cut away) with 3 rows of racks, a key rack with a drive sled, two closed sites behind, feed and link cables. Late wide shots in the mechanism subtract the clip's 4 deg/s orbit drift from their yaw to land near-frontal.
- Scene styles: posts 3, 10 and 20 used Gauge, GlidePath, SeaSection, ChatBox, CodeBlock, CycleDiagram, PhoneFrame. New for this post: a sky-to-ground stamp swap (setup) and a 100-square share grid (payoff), built reusable in `src/components/styles/`.
- Hook options scored (hookscore.py): #3 Nobody Tells You "...Amazon's cloud copies every file into 3 buildings" 83.0; #23-ish "The cloud uses 1.5% of the world's electricity..." 55.5; "Myth: your photos live in the sky. They live in 3 buildings." 51.2.

## Caption

Save this for the next time someone says their files are "up in the cloud". They sit in buildings full of computers.

That's how cloud storage actually works. When you back up a photo, it travels through cables to a data center and lands on a drive in a row of servers.

On Amazon's cloud (S3 Standard), copies go to at least three separate data centers, kilometers apart but within 100 km (60 mi) of each other. One building can lose power and your file is still there.

All of that runs on electricity. Data centers used about 1.5% of the world's electricity in 2024.

Source: AWS Amazon S3 documentation; IEA, Energy and AI (2025)

#cloudstorage #datacenter #howitworks #techexplained
