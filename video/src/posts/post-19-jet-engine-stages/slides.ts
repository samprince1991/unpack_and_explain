import type { CarouselScript } from "../../templates/types";

// Slide text copied verbatim from ideas/idea-19-jet-engine-stages/idea.md (npm run tracker checks it).
export const script: CarouselScript = {
  id: "post-19-jet-engine-stages",
  postNumber: 19,
  title: "Jet engine in 4 stages",
  coverHighlight: "never",
  source: "NASA Glenn Research Center",
  companionOf: 3,
  slides: [
    {
      kind: "cover",
      headline: "4 steps your plane never stops",
      body: "Suck, squeeze, bang, blow. How a jet engine works.",
    },
    {
      kind: "content",
      headline: "When it stops, you glide",
      body: "In 1983 a passenger jet lost both engines at 41,000 ft (12,500 m) and glided to a safe landing. Here's what had stopped.",
    },
    {
      kind: "content",
      headline: "Suck: the fan pulls air in",
      body: "The big fan at the front pulls in a huge stream of air. That air's all the engine has to work with.",
    },
    {
      kind: "content",
      headline: "Squeeze: the compressor packs it",
      body: "Rows of small spinning blades squeeze the air into less and less space, until it's tightly packed and hot.",
    },
    {
      kind: "content",
      headline: "Bang: fuel burns in the middle",
      body: "Fuel sprays into the packed air and burns in one steady flame. It stays lit as long as the engine's running.",
    },
    {
      kind: "content",
      headline: "Blow: hot gas spins the turbine",
      body: "The hot gas rushes out through the turbine, a wheel of blades at the back, and spins it like wind spins a pinwheel.",
    },
    {
      kind: "content",
      headline: "The trick: it keeps itself spinning",
      body: "Shafts link the turbine to the fan and compressor, so the loop keeps going. Leftover gas blasts out the back and pushes you forward.",
    },
    {
      kind: "recap",
      headline: "A jet engine in 4 steps",
      body: "1 Suck: fan pulls air in. 2 Squeeze: compressor packs it. 3 Bang: fuel burns. 4 Blow: hot gas spins the turbine and shoots out.",
    },
    {
      kind: "cta",
      headline: "Save this for your next flight",
      body: "Look out at the engine and name the 4 steps. Slide 8 has them all.",
    },
  ],
  // Checked 2026-11-06 against NASA Glenn (see the idea's notes).
  verify: [],
};
