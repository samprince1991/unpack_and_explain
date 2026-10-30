import { classicLook } from "../../templates/look";
import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-02-gps",
  postNumber: 2,
  format: "E",
  title: "How GPS finds you",
  hookText: "GPS doesn't track you",
  hookHighlight: "track",
  topic: "GPS",
  // Built before per-post looks: keep the approved look on re-renders.
  look: classicLook,
  // Most people think maps need data; land it right after "...works with no internet."
  meme: { id: "they-dont-know", section: "payoff", cue: "internet", seconds: 2 },
  source: "GPS.gov",
  // Built before 3D hero scenes: keep the approved mechanism on re-renders.
  hero3d: { optOut: "built before 3D heroes" },
  verify: [
    "Satellite count (about 30 operational)",
    "Relativity drift figure (commonly cited ~10 km / 6 mi per day)",
  ],
  sections: [
    {
      id: "question",
      voiceover: "Do you know how GPS actually finds you?",
      visual: "Question card (template).",
    },
    {
      id: "hook",
      voiceover: "GPS doesn't track you. Your phone just listens.",
      visual: "Phone icon with ears/sound waves; satellite beams arrive, nothing goes back.",
    },
    {
      id: "setup",
      voiceover:
        "About thirty GPS satellites orbit Earth, broadcasting precise timing signals and their positions.",
      visual: "Orbit animation, satellites emitting expanding rings.",
    },
    {
      id: "mechanism",
      voiceover:
        "Each signal carries the satellite's position and the exact moment it was sent. Your phone measures how late each signal arrives. Delay times the speed of light gives distance. Three satellites can illustrate how your position is calculated. A fourth lets your phone solve for its own clock error, too.",
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
      id: "congrats",
      voiceover: "Congrats, you just learned how GPS finds you.",
      visual: "Congrats card (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
