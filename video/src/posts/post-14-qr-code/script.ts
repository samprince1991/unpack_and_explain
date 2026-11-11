import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-14-qr-code",
  postNumber: 14,
  format: "E",
  title: "How a QR code stores data",
  hookText: "Which way is up?",
  hookHighlight: "up",
  topic: "QR code",
  source: "Denso Wave (qrcode.com); ISO/IEC 18004",
  blender: {
    model: "qr-code",
    // A cafe table at night: the QR code stands in its little block on the table, a coffee
    // cup to the left, a dark window behind, a pendant lamp above.
    world: "cafe",
    coverText: "Which way is up?",
    coverHighlight: "up",
    cover: { yaw: -12, pitch: 8, zoom: 1.3, keyPart: "finders", drift: 0.5, frameY: 0.62 },
    // Behind the question card: wide on the stand, the patch (the part that goes missing) amber.
    // Low in the frame, so the code sits under the question text (no captions over the card).
    opener: { yaw: -14, pitch: 10, zoom: 0.95, keyPart: "patch", drift: 1, frameY: 0.7 },
    hook: {
      // Starts tilted (roll), so turning upright on "way" is the claim made visible.
      yaw: 14,
      pitch: 8,
      // Small enough that the code sits under the two-line hook title and above the captions.
      zoom: 1.0,
      roll: -22,
      drift: 0.5,
      frameY: 0.52,
      keyPart: "finders",
      beats: [
        { cue: "squares", fallback: 0.35, do: "focus", part: "finders", shot: { zoom: 1.05 } },
        { cue: "way", fallback: 0.8, do: "shot", shot: { roll: 0, yaw: 0 } },
      ],
    },
    mechanism: {
      yaw: -18,
      pitch: 8,
      zoom: 1.15,
      roll: 18,
      drift: 0.5,
      frameY: 0.45,
      keyPart: "finders",
      beats: [
        // Your camera finds the three corner squares (amber), then turns the code upright.
        { cue: "corner", fallback: 0.14, do: "shot", shot: { keyPart: "finders" } },
        { cue: "upright", fallback: 0.29, do: "shot", shot: { roll: 0, yaw: 0 } },
        // Each small square is one bit: close on one module.
        { cue: "square", fallback: 0.38, do: "focus", part: "bit", shot: { zoom: 4.5, pitch: 0, yaw: 0 } },
        // Every eight bits: close on the 2 x 4 block, its bits as a label (not spoken).
        { cue: "eight", fallback: 0.62, do: "focus", part: "byte", shot: { zoom: 3.3, pitch: 0, yaw: 0 } },
        { cue: "letter", fallback: 0.7, do: "label", part: "byte", label: "01101110" },
        // Backup bits: wide, the patch amber; it tears away on "missing" and comes back on "worked".
        { cue: "backup", fallback: 0.75, do: "shot", shot: { keyPart: "patch", yaw: 0, pitch: 8, zoom: 1.15 } },
        { cue: "missing", fallback: 0.88, do: "explode" },
        { cue: "worked", fallback: 0.96, do: "collapse" },
      ],
    },
  },
  sfx: {
    custom: {
      // Quieter than the default: the chirp measured only 2.6 dB under the voice.
      scan: { prompt: "soft short electronic chirp of a phone camera scanning a code, gentle and clean", seconds: 0.8, volume: 0.1 },
      scratch: { prompt: "a fingernail scratching quickly across a paper sticker, short and dry", seconds: 0.8 },
      tear: { prompt: "a paper sticker corner tearing off, quick soft rip", seconds: 0.9 },
    },
    cues: [
      { sound: "scan", section: "hook", cue: "camera" },
      // "scratched" is the last word, so the cue sits on the "and" before it.
      { sound: "scratch", section: "setup", cue: "and", offsetFrames: 6 },
      { sound: "snap", section: "mechanism", cue: "upright" },
      { sound: "tick", section: "mechanism", cue: "letter" },
      { sound: "tear", section: "mechanism", cue: "missing" },
      { sound: "scan", section: "payoff", cue: "still" },
    ],
  },
  verify: [],
  sections: [
    {
      id: "question",
      voiceover: "Do you know how QR codes still scan with 30% missing?",
      visual:
        "Question card over the Blender opener: a QR code on a table stand on a cafe table at night, slow orbit, a patch of its modules amber.",
    },
    {
      id: "hook",
      voiceover: "Nobody tells you 3 squares tell your camera which way is up.",
      visual:
        "Blender hook: the QR code, tilted; on 'squares' the three corner squares amber; on 'way' the code turns upright.",
    },
    {
      id: "setup",
      voiceover: "A QR code is a grid of squares, each a yes or no. But your camera sees it tilted and scratched.",
      visual:
        "2D line art: a flat QR grid; on 'yes or no' one module flips black/white (amber); on 'tilted' the grid skews in perspective; on 'scratched' a scratch line drags across it (amber moves to the scratch).",
    },
    {
      id: "mechanism",
      voiceover:
        "So your camera finds the three corner squares first, and turns the code upright. Then each small square is one bit: black is one, white is zero. Every eight bits spell one letter. But backup bits are mixed in, so missing squares can be worked out.",
      visual:
        "Blender: wide on the tilted code, the three corner squares amber; on 'upright' the code turns upright; on 'square' close on one module (amber); on 'eight' close on a 2x4 block of modules (amber), on screen its bits \"01101110\"; on 'backup' wide, a 6x6 patch of modules amber; on 'missing' it tears away; on 'worked' it comes back into place.",
    },
    {
      id: "payoff",
      voiceover: "With the strongest backup, up to 30% can be missing, and it still scans.",
      visual:
        "2D: the QR grid with a torn corner and a logo square growing in the middle (no VO on the logo; it shows what \"missing\" looks like in real life); on '30%' a bar fills to \"30%\" (amber); on 'still scans' the scan frame locks onto the three corner squares and a link line appears under the code (amber moves to the link).",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned how a QR code stores data.",
      visual: "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
