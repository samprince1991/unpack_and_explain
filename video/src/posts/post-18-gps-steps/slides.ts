import type { CarouselScript } from "../../templates/types";

// Slide text copied verbatim from ideas/idea-18-gps-steps/idea.md (npm run tracker checks it).
export const script: CarouselScript = {
  id: "post-18-gps-steps",
  postNumber: 18,
  title: "How GPS works in 4 steps",
  coverHighlight: "pin",
  source: "GPS.gov",
  companionOf: 2,
  slides: [
    {
      kind: "cover",
      headline: "No internet. Still a pin. Why?",
      body: "How GPS finds you, in 4 steps.",
    },
    {
      kind: "content",
      headline: "Your phone never talks to GPS",
      body: "It only listens. Nothing goes back up to the satellites, so your location works with no internet.",
    },
    {
      kind: "content",
      headline: "Step 1: satellites broadcast",
      body: "About 30 GPS satellites orbit Earth. Each one sends out its position and the exact moment the signal left.",
    },
    {
      kind: "content",
      headline: "Step 2: your phone times it",
      body: "Each signal arrives a tiny bit late, because it travelled all the way from orbit. Your phone measures that delay.",
    },
    {
      kind: "content",
      headline: "Step 3: delay becomes distance",
      body: "Signals travel at the speed of light. Delay times the speed of light gives the distance to each satellite.",
    },
    {
      kind: "content",
      headline: "Step 4: four satellites, one pin",
      body: "Three distances meet at one point: you. A fourth fixes your phone's own clock error, so that point is accurate.",
    },
    {
      kind: "content",
      headline: "Einstein keeps it accurate",
      body: "Satellite clocks are corrected for relativity. Skip that, and your position would drift about 10 km (6 mi) every day.",
    },
    {
      kind: "recap",
      headline: "GPS in 4 steps",
      body: "1 Satellites broadcast position and time. 2 Phone times the delay. 3 Delay x light speed = distance. 4 Four distances = you. Source: GPS.gov",
    },
    {
      kind: "cta",
      headline: "Save this cheat sheet",
      body: "Next time someone says GPS is tracking them, swipe back to slide 8.",
    },
  ],
  verify: [
    "Satellite count (about 30 operational)",
    "Altitude (roughly 20,000 km / 12,500 mi)",
    "Relativity drift figure (commonly cited ~10 km / 6 mi per day)",
  ],
};
