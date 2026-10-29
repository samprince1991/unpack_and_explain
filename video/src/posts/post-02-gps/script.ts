import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-02-gps",
  postNumber: 2,
  format: "E",
  title: "How GPS finds you",
  hookText: "GPS doesn't track you",
  hookHighlight: "track",
  source: "GPS.gov",
  verify: [
    "Satellite count (about 30 operational)",
    "Relativity drift figure (commonly cited ~10 km / 6 mi per day)",
  ],
  sections: [
    {
      id: "hook",
      voiceover: "GPS doesn't track you. Your phone just listens.",
      visual: "Phone icon with ears/sound waves; satellite beams arrive, nothing goes back.",
    },
    {
      id: "setup",
      voiceover:
        "About thirty satellites circle the Earth, and all they do is broadcast the time.",
      visual: "Orbit animation, satellites emitting expanding rings.",
    },
    {
      id: "mechanism",
      voiceover:
        "Each signal carries the satellite's position and the exact moment it was sent. Your phone measures how late each signal arrives. Delay times the speed of light gives distance. Three distances pin down your position. A fourth fixes your phone's clock.",
      visual:
        "Circles from 3 satellites overlap at one point; a 4th circle snaps in and a small clock icon corrects itself.",
    },
    {
      id: "payoff",
      voiceover:
        "Your phone never sends anything back, so GPS works with no internet. And the satellites' clocks are corrected for relativity. Skip that, and you'd drift by several kilometers every day.",
      visual:
        "Phone shows airplane mode and still has a location pin. Clock with a tiny correction arrow.",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
