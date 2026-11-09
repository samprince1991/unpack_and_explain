import type { PostScript } from "../../templates/types";

// First post built with Blender 3D.
export const script: PostScript = {
  id: "post-03-jet-engine",
  postNumber: 3,
  format: "F",
  title: "How a jet engine works + Gimli Glider",
  hookText: "41,000 ft. Zero engines.",
  hookHighlight: "Zero",
  // The VO already says it and the 3D engine carries the hook: no title over it.
  hookTitle: false,
  topic: "jet engine",
  source: "Board of Inquiry, Air Canada Flight 143 (1983)",
  sfx: { optOut: "posted before SFX" },
  failureSection: "payoff",
  blender: {
    model: "jet-engine",
    // Non-breaking space keeps "41,000 ft." on one line at display size.
    coverText: "41,000 ft. Zero engines.",
    coverHighlight: "Zero",
    cover: { yaw: -35, pitch: 18, zoom: 1.1, keyPart: "combustor" },
    opener: { yaw: -50, pitch: 16, zoom: 1.15, keyPart: "combustor" },
    hook: {
      yaw: -40,
      pitch: 18,
      zoom: 1.1,
      keyPart: "combustor",
      beats: [
        // Running engine: fan turning, combustor lit. On "lost" it dies.
        { cue: "In", fallback: 0, do: "spin", part: "fan" },
        { cue: "lost", fallback: 0.3, do: "stop" },
        { cue: "survived", fallback: 0.75, do: "shot", shot: { yaw: -15, zoom: 1 } },
      ],
    },
    mechanism: {
      yaw: -30,
      pitch: 26,
      zoom: 1.25,
      exploded: true,
      beats: [
        { cue: "fan", fallback: 0.05, do: "focus", part: "fan" },
        { cue: "pulls", fallback: 0.08, do: "spin", part: "fan" },
        { cue: "compressor", fallback: 0.22, do: "focus", part: "compressor" },
        { cue: "burns", fallback: 0.42, do: "focus", part: "combustor" },
        { cue: "Blow", fallback: 0.55, do: "focus", part: "turbine" },
        { cue: "spins", fallback: 0.6, do: "spin", part: "turbine" },
        { cue: "blasts", fallback: 0.75, do: "flow", part: "turbine", to: "nozzle" },
        { cue: "pushes", fallback: 0.88, do: "collapse" },
      ],
    },
  },
  verify: [],
  sections: [
    {
      id: "question",
      voiceover: "Do you know the 4 steps that never stop in a jet engine?",
      visual: "Question card (template) over the Blender opener: the engine, combustor amber.",
    },
    {
      id: "hook",
      voiceover:
        "In 1983, a passenger jet lost both engines at 41,000 feet. Everyone survived. Here's why.",
      visual:
        "Blender hook: the running engine (fan spinning, combustor amber) dies on 'lost': amber goes out, the fan coasts to a stop. 12,500 m conversion under the title.",
    },
    {
      id: "setup",
      voiceover: "A jet engine is a machine that burns fuel without stopping.",
      visual: "2D: fuel drops travel a line into an amber flame that never goes out; depth layers and dust.",
    },
    {
      id: "mechanism",
      voiceover:
        "Suck: a fan pulls in air. Squeeze: a compressor packs it tight. Bang: fuel burns in the middle. Blow: hot gas spins a turbine, then blasts out the back and pushes the plane forward.",
      visual:
        "Blender mechanism: exploded engine; the camera and the amber move fan > compressor > combustor > turbine, an amber dot flows out of the nozzle, then the engine closes up.",
    },
    {
      id: "payoff",
      voiceover:
        "Air Canada Flight 143 ran dry after a pounds-versus-kilograms mix-up in the fuel calculation. The plane got less than half the fuel it needed. The pilots glided to an airfield in Gimli, Canada, and landed safely.",
      visual:
        "2D: fuel gauge with a kg / lb unit swap, the amber needle drops below half; then a side-view glide path arcs down to a runway and lands.",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned how a jet engine works.",
      visual: "Congrats card (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
