import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-21-phone-accelerometer",
  postNumber: 21,
  format: "E",
  title: "How your phone knows which way is up",
  hookText: "A weight on springs",
  hookHighlight: "weight",
  // The VO says these same words, so the 3D gets the whole visual region instead.
  hookTitle: false,
  topic: "chip",
  source: "STMicroelectronics; patent US6910379; Android developer docs",
  sfx: {
    custom: {
      springwobble: { prompt: "tiny metal spring wobbling briefly, soft and delicate", seconds: 1 },
      fallrush: { prompt: "soft rush of air as a small object falls, gentle whoosh", seconds: 1.5 },
    },
    cues: [
      { sound: "springwobble", section: "hook", cue: "weight" },
      { sound: "sweep", section: "setup", cue: "turn" },
      { sound: "tick", section: "setup", cue: "weight" },
      { sound: "springwobble", section: "mechanism", cue: "drags" },
      { sound: "tick", section: "mechanism", cue: "number" },
      { sound: "snap", section: "mechanism", cue: "directions" },
      { sound: "fallrush", section: "payoff", cue: "drop" },
      { sound: "tick", section: "payoff", cue: "nearly" },
    ],
  },
  blender: {
    model: "mems-accelerometer",
    worldOptOut: "built before worlds were required",
    coverText: "Your phone hides this",
    coverHighlight: "hides",
    // Yaw 0 looks straight at the open back of the phone and the die.
    cover: { yaw: -16, pitch: 12, zoom: 7, keyPart: "weight", exploded: true, aim: "weight" },
    opener: { yaw: -18, pitch: 8, zoom: 5, keyPart: "lid", drift: 2, aim: "lid" },
    hook: {
      yaw: -22,
      pitch: 8,
      zoom: 1.15,
      drift: 2,
      beats: [
        // Phone to chip, the lid lifts off, then in on the weight. Camera moves take 18 frames
        // and must not overlap: "your" and "weight" are 26 frames apart, with the lid between.
        { cue: "your", fallback: 0.24, do: "focus", part: "lid", shot: { yaw: -16, zoom: 7 } },
        { cue: "hides", fallback: 0.37, do: "shift", part: "lid", by: [0, -0.03, 0.3] },
        { cue: "weight", fallback: 0.47, do: "focus", part: "weight", shot: { zoom: 13, yaw: -12 } },
      ],
    },
    mechanism: {
      yaw: -12,
      pitch: 8,
      zoom: 11,
      exploded: true,
      aim: "weight",
      // A flat die goes edge-on with the default orbit over a clip this long.
      drift: 1,
      beats: [
        { cue: "comb", fallback: 0.08, do: "focus", part: "weight", shot: { zoom: 16, yaw: -12 } },
        { cue: "between", fallback: 0.15, do: "focus", part: "fixedtop", shot: { zoom: 22, yaw: -14 } },
        // The whole die tilts on screen (camera roll), then the weight slides downhill.
        { cue: "tilt", fallback: 0.26, do: "focus", part: "weight", shot: { zoom: 15, roll: 15, yaw: -14 } },
        { cue: "drags", fallback: 0.34, do: "shift", part: "weight", by: [0.0005, 0, 0] },
        // Close-up on the gaps while the weight keeps sliding, so they visibly narrow.
        { cue: "gaps", fallback: 0.44, do: "focus", part: "fixedtop", shot: { zoom: 32 } },
        { cue: "change", fallback: 0.47, do: "shift", part: "weight", by: [0.0012, 0, 0] },
        // Keep moving through the long close-up: in on the gap, then out for the reading.
        { cue: "charge", fallback: 0.52, do: "shot", shot: { zoom: 38, yaw: -8 } },
        { cue: "chip", fallback: 0.6, do: "shot", shot: { zoom: 26, yaw: -14 } },
        // Back upright and wide, the weight home, three arrows for three directions.
        { cue: "three", fallback: 0.72, do: "stop" },
        { cue: "three", fallback: 0.72, do: "wide", shot: { roll: 0, yaw: -36, pitch: 20, zoom: 9, aim: "weight" } },
        { cue: "three", fallback: 0.72, do: "shift", part: "weight", by: [0, 0, 0] },
        { cue: "three", fallback: 0.72, do: "appear", part: "axisx" },
        { cue: "directions", fallback: 0.76, do: "appear", part: "axisy" },
        { cue: "directions", fallback: 0.76, do: "appear", part: "ground" },
        { cue: "ground", fallback: 0.95, do: "shot", shot: { keyPart: "ground" } },
      ],
    },
  },
  verify: [
    "Exact proof-mass size in a specific phone sensor: no public spec, so say 'smaller than 1 mm (0.04 in)'",
    "'2-millimeter chip' is spoken without 'about': the source says the package is about 2 x 2 x 1 mm, and ST's figure is not specific to one phone",
  ],
  sections: [
    {
      id: "question",
      voiceover: "Do you know what a 2-millimeter chip actually hides?",
      visual: "Question card (template) over the Blender opener: the chip in close-up. Topic word: chip.",
    },
    {
      id: "hook",
      voiceover: "Nobody tells you your phone hides a weight on springs.",
      visual:
        "Blender hook: camera goes from the phone to the chip, then the lid lifts off. The weight turns amber on 'weight'.",
    },
    {
      id: "setup",
      voiceover: "Turn your phone sideways and the screen follows. That weight is how it knows.",
      visual:
        "2D line art: a phone rotates and its screen follows. Label: 2 mm (0.08 in) chip, weight under 1 mm (0.04 in).",
    },
    {
      id: "mechanism",
      voiceover:
        "The weight has tiny comb fingers, between fingers that don't move. Tilt your phone and gravity drags it slightly. The gaps change, so the electric charge they hold changes, and the chip turns that into a number. It does this in three directions. Together, those numbers point at the ground.",
      visual:
        "Blender mechanism: wide on the die; close-ups on the weight and the fixed fingers; on 'tilt' the die tilts and on 'drags' the weight slides, springs stretching; on 'gaps' a close-up as the gaps narrow, with 0.26 g on 'number'; wide and upright on 'three' as three arrows appear; the down arrow turns amber on 'ground'.",
    },
    {
      id: "payoff",
      voiceover:
        "Up is just the other way. Drop your phone, and the weight stops tugging its springs. All three numbers fall to nearly zero.",
      visual:
        "2D: the arrow flips to point up. The phone falls, and three bars (no invented figures) drop to almost nothing, with the key bar amber.",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned how a tiny chip finds up.",
      visual: "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
