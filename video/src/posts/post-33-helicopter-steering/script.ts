import type { PostScript } from "../../templates/types";

// Model units: the helicopter's longest side (8.75 m, blade tip to fin) is 2, so 1 m is 2 / 8.75.
const METER = 2 / 8.58; // the model's 8.58 m (blade tip to tail skid) is 2 units

export const script: PostScript = {
  id: "post-33-helicopter-steering",
  postNumber: 33,
  format: "E",
  title: "How a helicopter steers",
  hookText: "2 plates steer it all",
  hookHighlight: "2 plates",
  topic: "helicopter",
  source: "FAA Helicopter Flying Handbook",
  blender: {
    // A generic light two-blade helicopter hovering over the grass of the coast world. Rotor
    // spins counter-clockwise seen from above; forward is +x, so `tilt` [0, 8, 0] tips the
    // plate and the rotor forward (the rear rises) and nose-down on the whole helicopter.
    model: "helicopter",
    world: "coast",
    coverText: "How helicopters really steer",
    coverHighlight: "steer",
    // Hero cover (docs/blender.md "Cover"): close, low three-quarter, high in the frame so the
    // rotor head rises into the title.
    cover: { yaw: 35, pitch: 4, zoom: 4, keyPart: "plates", drift: 0.5, frameY: 0.41, coast: "land" },
    // Behind the question card: three-quarter front, the hub amber, low in the frame, the
    // main and tail rotors already turning at frame 0.
    opener: {
      yaw: 40,
      pitch: 10,
      zoom: 2.2,
      keyPart: "hub",
      drift: 1,
      frameY: 0.68,
      coast: "land",
      beats: [
        { cue: "Do", fallback: 0, do: "spin", part: "hub" },
        { cue: "Do", fallback: 0, do: "spin", part: "swashUpper" },
        { cue: "Do", fallback: 0, do: "spin", part: "tailRotor" },
      ],
    },
    hook: {
      // Wide and low with the rotor turning, then up to the rotor head: the two plates amber.
      yaw: 30,
      pitch: 6,
      zoom: 2.2,
      drift: 1,
      frameY: 0.5,
      coast: "land",
      beats: [
        { cue: "Nobody", fallback: 0, do: "spin", part: "hub" },
        { cue: "Nobody", fallback: 0, do: "spin", part: "swashUpper" },
        { cue: "Nobody", fallback: 0, do: "spin", part: "tailRotor" },
        { cue: "plates", fallback: 0.26, do: "focus", part: "swashLower", shot: { yaw: 25, pitch: -4, zoom: 12 } },
        { cue: "plates", fallback: 0.26, do: "shot", shot: { keyPart: "plates" } },
      ],
    },
    mechanism: {
      yaw: 30,
      pitch: 8,
      zoom: 2.2,
      drift: 0.5,
      frameY: 0.5,
      coast: "land",
      beats: [
        { cue: "Under", fallback: 0, do: "spin", part: "hub" },
        { cue: "Under", fallback: 0, do: "spin", part: "swashUpper" },
        { cue: "Under", fallback: 0, do: "spin", part: "tailRotor" },
        // The swashplate: close on the rotor head; the still plate amber, then the spinning one.
        { cue: "swashplate", fallback: 0.05, do: "focus", part: "swashLower", shot: { yaw: 25, pitch: -4, zoom: 12 } },
        { cue: "spins", fallback: 0.2, do: "shot", shot: { keyPart: "swashUpper" } },
        // Collective: the whole plate rises 10 cm (the links stretch to the blades).
        { cue: "whole", fallback: 0.33, do: "shot", shot: { keyPart: "plates" } },
        { cue: "rises", fallback: 0.36, do: "shift", part: "swashLower", by: [0, 0, 0.1 * METER], frames: 16 },
        // Every blade bites harder: out to the blade roots, low, both pitch up 16 degrees.
        { cue: "Every", fallback: 0.42, do: "shot", shot: { pitch: 3, zoom: 6, keyPart: "blades" } },
        { cue: "bites", fallback: 0.45, do: "tilt", part: "bladeA", by: [16, 0, 0] },
        { cue: "bites", fallback: 0.45, do: "tilt", part: "bladeB", by: [-16, 0, 0] },
        // So it climbs: wide, the lift arrow, the whole helicopter rises 0.8 m.
        { cue: "climbs", fallback: 0.5, do: "wide", shot: { pitch: 6 } },
        { cue: "climbs", fallback: 0.5, do: "appear", part: "lift" },
        { cue: "climbs", fallback: 0.5, do: "shot", shot: { keyPart: "lift" } },
        { cue: "climbs", fallback: 0.5, do: "shift", part: "helicopter", by: [0, 0, 0.8 * METER], frames: 30 },
        // Cyclic: back to the plates, which tilt forward 8 degrees.
        { cue: "Push", fallback: 0.56, do: "vanish", part: "lift" },
        { cue: "cyclic", fallback: 0.58, do: "focus", part: "swashLower", shot: { yaw: 15, pitch: -4, zoom: 12 } },
        { cue: "tilts", fallback: 0.66, do: "tilt", part: "swashLower", by: [0, 8, 0], frames: 16 },
        // One side of the blade circle: from above, the arc over the rear, where the blades rise.
        { cue: "Each", fallback: 0.72, do: "shot", shot: { pitch: 32, zoom: 2.2, keyPart: "arc" } },
        { cue: "Each", fallback: 0.72, do: "appear", part: "arc" },
        // The rotor tilts forward with it ("side": the second "tilts" can't be a cue).
        { cue: "side", fallback: 0.8, do: "tilt", part: "hub", by: [0, 8, 0], frames: 18 },
        // And the helicopter goes that way: nose down, 2 m forward, wide.
        { cue: "goes", fallback: 0.94, do: "wide", shot: { pitch: 8 } },
        { cue: "goes", fallback: 0.94, do: "shot", shot: { keyPart: "blades" } },
        { cue: "goes", fallback: 0.94, do: "vanish", part: "arc" },
        { cue: "goes", fallback: 0.94, do: "tilt", part: "helicopter", by: [0, 6, 0], frames: 20 },
        { cue: "goes", fallback: 0.94, do: "shift", part: "helicopter", by: [2 * METER, 0, 0.8 * METER], frames: 30 },
      ],
    },
  },
  sfx: {
    custom: {
      // The rotor overhead in the hook: a steady soft thump, far off, no engine whine.
      rotor: { prompt: "distant helicopter rotor blades thumping steadily overhead, soft, no engine whine", seconds: 2.5, volume: 0.08 },
      // The swashplate sliding up the mast and tilting: a short smooth mechanical slide.
      slide: { prompt: "short smooth metal sliding click, well-oiled mechanism moving, soft", seconds: 0.7, volume: 0.12 },
      // The body twisting round in the payoff: a soft airy turning whoosh.
      // Quieter than the default: it measured only 7.3 dB under the voice.
      turn: { prompt: "soft airy whoosh turning round, gentle rotation swish, short", seconds: 1, volume: 0.1 },
    },
    cues: [
      { sound: "rotor", section: "hook", cue: "Nobody" },
      { sound: "tick", section: "setup", cue: "rotor" },
      { sound: "slide", section: "mechanism", cue: "rises" },
      // Just after the word, in the pause before "Push": it measured only 7.7 dB under the voice
      // when it led the word.
      { sound: "swell", section: "mechanism", cue: "climbs", offsetFrames: 8 },
      { sound: "slide", section: "mechanism", cue: "tilts" },
      { sound: "turn", section: "payoff", cue: "twists" },
      { sound: "snap", section: "payoff", cue: "pushes" },
    ],
  },
  verify: [],
  sections: [
    {
      id: "question",
      voiceover: "Do you know how 1 rotor actually steers a helicopter?",
      visual:
        "Question card over the Blender opener: a light single-rotor helicopter (procedural) hovering, the rotor hub amber.",
    },
    {
      id: "hook",
      voiceover: "Nobody tells you 2 plates do almost all of a helicopter's steering.",
      visual: "Blender hook: camera rises to the rotor hub and finds the two plates (amber) on '2 plates'.",
    },
    {
      id: "setup",
      voiceover: "A helicopter has no wing flaps to steer with. Its one main rotor has to do everything.",
      visual:
        "2D: the helicopter nose on; on 'flaps' dashed wings with flaps where a plane would have them, which fade away; on 'rotor' the main rotor turns amber, its blades turning. Parallax + dust.",
    },
    {
      id: "mechanism",
      voiceover:
        "Under the rotor sits the swashplate: one plate stays still, one spins. Pull the collective lever, and the whole plate rises. Every blade bites harder, so it climbs. Push the cyclic stick, and the plate tilts. Each blade bites harder on one side, the rotor tilts, and the helicopter goes that way.",
      visual:
        "Blender close-ups: the swashplate, lower plate neutral, upper plate spinning on 'one that spins'; plate rises on 'whole plate rises', all blades twist up together (amber), helicopter climbs; plate tilts on 'tilts', one side of the blade circle highlighted on 'one side'; the rotor disc tilts and the helicopter drifts that way; wide.",
    },
    {
      id: "payoff",
      voiceover: "But spinning the rotor twists the body the other way. So a small tail rotor pushes sideways to hold the nose straight.",
      visual:
        "2D top-down (payoff stays 2D): rotor turning anticlockwise; the body swings clockwise with a curved amber arrow on 'twists the body'; the tail rotor turns amber on 'tail rotor' and a push arrow comes off the tail on 'pushes', the body swings back and the nose holds still.",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned how a helicopter steers.",
      visual: "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
