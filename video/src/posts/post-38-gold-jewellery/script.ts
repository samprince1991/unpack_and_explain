import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-38-gold-jewellery",
  postNumber: 38,
  format: "E",
  title: "How gold jewellery is made",
  hookText: "It's part copper",
  hookHighlight: "copper",
  topic: "gold jewellery",
  source: "World Gold Council; Bureau of Indian Standards; Ganoksin",
  blender: {
    model: "gold-casting",
    // Jeweller's bench at night: melting dish on the left, the finished ring front and
    // center, its wax twin on the right (the plaster block rises around it).
    world: "bench",
    coverText: "It's part copper",
    coverHighlight: "copper",
    cover: { yaw: -10, pitch: 12, zoom: 2.6, keyPart: "ring", aim: "ring", drift: 1, frameY: 0.55 },
    opener: { yaw: -6, pitch: 14, zoom: 1.15, keyPart: "ring", drift: 1.5, frameY: 0.6 },
    hook: {
      yaw: -6,
      pitch: 13,
      zoom: 1.15,
      drift: 1,
      frameY: 0.55,
      beats: [
        // "your gold ring": close on the finished ring, amber, which turns slowly on "copper".
        { cue: "gold", fallback: 0.4, do: "focus", part: "ring" },
        { cue: "copper", fallback: 0.85, do: "spin", part: "ring" },
      ],
    },
    mechanism: {
      yaw: 0,
      pitch: 14,
      zoom: 1.15,
      drift: 1,
      // Lower than the 0.42 default: the 2D karat and kiln lines (y 480) sit clear above the
      // plaster block in the close-ups.
      frameY: 0.52,
      beats: [
        // Melt it with copper and silver: close on the dish's grains, from above to see inside.
        { cue: "melt", fallback: 0.04, do: "focus", part: "grains", shot: { pitch: 50 } },
        // ...which make it hard: one molten pool rises over the grains, the new key.
        { cue: "hard", fallback: 0.22, do: "appear", part: "melt" },
        { cue: "hard", fallback: 0.22, do: "shot", shot: { keyPart: "melt" } },
        // (The "22k = 22/24 = 91.6%" line is 2D text in MechanismScene.)
        // A wax copy of the ring: close on the wax twin standing on the bench, amber.
        { cue: "copy", fallback: 0.48, do: "focus", part: "waxring", shot: { pitch: 12, zoom: 2.8 } },
        // ...buried in plaster: both plaster halves rise around it and hide it; the plaster is the key.
        { cue: "buried", fallback: 0.56, do: "appear", part: "plasterback" },
        { cue: "buried", fallback: 0.56, do: "appear", part: "plasterfront" },
        { cue: "buried", fallback: 0.56, do: "shot", shot: { keyPart: "plasterfront" } },
        // A hot kiln (2D "730 °C (1,350 °F)") melts the wax out: the front half and the wax
        // leave (explode, the away parts), and the ring-shaped hole and its channel show.
        { cue: "out", fallback: 0.7, do: "explode" },
        { cue: "hole", fallback: 0.76, do: "appear", part: "hollow" },
        // Zoom set by hand: the automatic close-up on the thin imprint crops the plaster.
        { cue: "hole", fallback: 0.76, do: "focus", part: "hollow", shot: { pitch: 10, zoom: 2.8 } },
        // Molten gold is poured in: the amber dot travels from the dish into the channel...
        { cue: "molten", fallback: 0.82, do: "flow", part: "melt", to: "hollow" },
        // ...and sets in that exact shape: the gold ring and stick appear in the hole.
        { cue: "sets", fallback: 0.9, do: "vanish", part: "hollow" },
        { cue: "sets", fallback: 0.9, do: "appear", part: "cast" },
        { cue: "sets", fallback: 0.9, do: "shot", shot: { keyPart: "cast", zoom: 2.8 } },
        // Wide again, the cast ring the key.
        { cue: "exact", fallback: 0.95, do: "wide", shot: { yaw: 0, pitch: 14, zoom: 1.15 } },
      ],
    },
  },
  sfx: {
    custom: {
      // Quieter than the default: a metallic transient measured only 5.9 dB under the voice.
      clink: { prompt: "small gold ring set down on a wooden workbench, single soft metallic clink", seconds: 0.8, volume: 0.12 },
      melt: { prompt: "soft bubbling sizzle of molten metal in a small ceramic crucible, gentle", seconds: 1.5 },
      pour: { prompt: "thin stream of molten metal pouring into a mould, soft liquid hiss", seconds: 1.5 },
    },
    cues: [
      { sound: "clink", section: "hook", cue: "gold" },
      { sound: "sweep", section: "setup", cue: "scratches" },
      { sound: "melt", section: "mechanism", cue: "melt" },
      { sound: "pour", section: "mechanism", cue: "molten" },
      { sound: "tick", section: "payoff", cue: "sixteen" },
    ],
  },
  verify: [],
  sections: [
    {
      id: "question",
      voiceover: "Do you know why 22k gold jewellery is only 91.6% gold?",
      visual:
        "Question card over the Blender opener: a gold ring on a jeweller's bench at night under a desk lamp, slow orbit, the ring amber.",
    },
    {
      id: "hook",
      voiceover: "Nobody tells you your gold ring is part copper.",
      visual:
        "Blender hook: close on the gold ring on 'gold' (amber); it turns slowly on 'copper'.",
    },
    {
      id: "setup",
      voiceover: "Most gold jewellery isn't pure 24 karat gold. Pure gold is so soft it scratches and bends.",
      visual:
        "2D line art: a plain ring band; on 'pure gold' an inset \"24k = 99.9%\" label; on 'scratches' a scratch line drags across the band (amber); on 'bends' the band dents inward (amber moves to the dent). Parallax + dust.",
    },
    {
      id: "mechanism",
      voiceover:
        "So jewellers melt it with a little copper and silver, which make it hard. In 22 karat, that's just 2 parts in 24. Then a wax copy of the ring is buried in plaster. A hot kiln melts the wax out, leaving a ring-shaped hole. Molten gold is poured in and sets in that exact shape.",
      visual:
        "Blender: close on the melting dish, the gold, copper and silver grains amber; on 'hard' one molten pool rises over them, on screen \"22k = 22/24 = 91.6% gold\"; on 'wax copy' close on the wax twin of the ring standing on the bench, a wax stick on top (amber); on 'buried' a plaster block rises around it and hides it (plaster amber); on 'kiln' on screen \"Kiln: 730 °C (1,350 °F)\"; on 'out' the front half of the plaster lifts away and the wax is gone: a ring-shaped hole and its channel show (amber); on 'molten' the amber dot travels from the dish into the channel; on 'sets' the gold ring appears in the hole (amber); wide.",
    },
    {
      id: "payoff",
      voiceover: "So the stamp inside your ring is the recipe. Nine sixteen means 91.6% gold.",
      visual:
        "2D: close-up of the inside of the band, stamp \"22K916\" with 916 in amber; a 1,000-cell grid fills 916 cells amber on 'means'; the last 84 cells stay neutral (the copper and silver).",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned how gold jewellery is made.",
      visual: "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
