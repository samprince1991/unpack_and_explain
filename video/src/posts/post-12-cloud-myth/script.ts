import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-12-cloud-myth",
  postNumber: 12,
  format: "Q",
  title: "Myth: 'Cloud storage is in the sky'",
  hookText: "3 buildings, not the sky",
  hookHighlight: "3",
  topic: "cloud",
  source: "AWS Amazon S3 docs; IEA, Energy and AI (2025)",
  sfx: { optOut: "sounds not made yet" },
  blender: {
    model: "data-center",
    worldOptOut: "built before worlds were required",
    coverText: "The cloud has walls",
    coverHighlight: "walls",
    // yaw 0 looks from the front (the feed cable side); pitch high enough to see into
    // the hall's open roof.
    cover: { yaw: -24, pitch: 30, zoom: 1.25, keyPart: "rack" },
    opener: { yaw: 28, pitch: 34, zoom: 1.6, keyPart: "rack" },
    hook: {
      // Starts close on the hall, then pulls back on "copies" to show all three sites.
      yaw: -18,
      pitch: 30,
      zoom: 2.6,
      keyPart: "hall",
      beats: [{ cue: "copies", fallback: 0.45, do: "shot", shot: { zoom: 1.45, yaw: -8, pitch: 34 } }],
    },
    mechanism: {
      // Near-frontal yaw keeps the two side sites inside the column on the wide shots.
      yaw: -8,
      pitch: 32,
      zoom: 1.3,
      beats: [
        // The photo arrives down the feed cable and lands in the key rack (close-up).
        { cue: "races", fallback: 0.06, do: "flow", part: "feed", to: "rack" },
        { cue: "drives", fallback: 0.28, do: "focus", part: "drive", shot: { yaw: -12, pitch: 22 } },
        // Pull back, then the copies travel to the other two sites.
        // The clip drifts +4 deg/s (orbit) and pushes in 10%: the late wides take that out
        // (yaw minus the drift so far, a little less zoom) to land near-frontal again.
        { cue: "Then", fallback: 0.45, do: "wide", shot: { yaw: -38, pitch: 32, zoom: 1.2 } },
        { cue: "copies", fallback: 0.5, do: "flow", part: "drive", to: "site2", follow: false },
        { cue: "more", fallback: 0.56, do: "flow", part: "drive", to: "site3", follow: false },
        { cue: "kilometers", fallback: 0.66, do: "label", part: "site2", label: "≤ 100 km / 60 mi" },
        // The hall "loses power": amber off; the copy at site 2 is the one that matters now.
        // ("photo" is also spoken in the first sentence, so the last wide cues on "has".)
        { cue: "If", fallback: 0.78, do: "stop" },
        { cue: "power", fallback: 0.84, do: "focus", part: "site2", shot: { yaw: -40 } },
        { cue: "has", fallback: 0.94, do: "wide", shot: { yaw: -66, pitch: 32, zoom: 1.15 } },
      ],
    },
  },
  verify: [],
  sections: [
    {
      id: "question",
      voiceover: "Do you know where the cloud actually sits on Earth?",
      visual:
        "Question card (template) over the Blender opener: a data-center building with the roof cut away, rows of server racks inside, one rack amber.",
    },
    {
      id: "hook",
      voiceover: "Nobody tells you Amazon's cloud copies your files into 3 buildings.",
      visual:
        "Blender hook: close on one data-center building, camera pulls back on 'copies' to reveal three buildings far apart on the ground; the first building amber.",
    },
    {
      id: "setup",
      voiceover:
        "Most people picture the cloud somewhere up in the sky. It's actually a warehouse full of computers.",
      visual:
        "2D: a line-art cloud floats high in the visual region with a coral MYTH stamp on 'sky'; on 'warehouse' the cloud drops and redraws as a building outline, teal FACT stamp. Parallax + dust.",
    },
    {
      id: "mechanism",
      voiceover:
        "Upload a photo, and it races through cables to a data center. It's saved onto drives, in long rows of servers. Then copies go to at least two more buildings, kilometers apart. If one loses power, another still has your photo.",
      visual:
        "Blender mechanism: wide on the three buildings; an amber dot flows along the feed cable into the hall on 'races' and lands in a rack (close-up); focus on the drive sled (amber) on 'drives'; wide on 'Then'; amber dots flow to sites 2 and 3 on 'copies' / 'more' (label '≤ 100 km / 60 mi'); amber off on 'If'; close-up on site 2 (amber) on 'power'; wide on 'has'.",
    },
    {
      id: "payoff",
      voiceover:
        "All those buildings need power. Data centers used about 1.5% of the world's electricity in 2024. Quite a power bill for something in the sky.",
      visual:
        "2D: a 100-square grid fills in neutral; on '1.5%' one and a half squares turn amber with a 1.5% counter; on 'sky' the cloud from the setup floats back in, now with a plug cable hanging down to the ground.",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned where the cloud really lives.",
      visual: "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
