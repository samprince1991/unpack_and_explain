import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-37-ev-cold-range",
  postNumber: 37,
  format: "E",
  title: "Why electric cars lose range in the cold",
  hookText: "The heater eats range",
  hookHighlight: "heater",
  topic: "electric car",
  source: "AAA, Feb 2019 EV temperature study; fueleconomy.gov, cold weather",
  blender: {
    // A generic compact electric hatchback (procedural, no badges) parked in a bay of a
    // snowy supermarket car park at night, under a cool white lamp. Cameras sit on the -Y
    // side (yaw +30 is the front three-quarter of that side); the snowbank and the shop are
    // behind the car. "explode" is the X-ray: the shell, glass, trim, seats and dashboard
    // drop away; the wheels, steering wheel, battery, drive unit, heater and their two
    // cables stay.
    model: "ev-hatchback",
    world: "snow",
    coverText: "Electric cars hate winter",
    coverHighlight: "winter",
    cover: { yaw: 32, pitch: 5, zoom: 2.0, keyPart: "battery", drift: 0.5, frameY: 0.5 },
    // Behind the question card: the closed car in the snow, low in the frame under the
    // question text; on "electric" the shell drops away and the battery glows amber.
    opener: {
      yaw: 28,
      pitch: 16,
      zoom: 1.2,
      keyPart: "battery",
      drift: 1,
      frameY: 0.68,
      beats: [{ cue: "electric", fallback: 0.3, do: "explode" }],
    },
    hook: {
      // Already X-rayed: an amber dot runs from the battery along the heat cable to the
      // heater, which turns amber on "heater".
      yaw: 60,
      pitch: 24,
      zoom: 1.3,
      exploded: true,
      keyPart: "battery",
      drift: 0.5,
      frameY: 0.55,
      beats: [{ cue: "heater", fallback: 0.4, do: "flow", part: "battery", to: "heater", shot: { yaw: 70, pitch: 35, zoom: 2.6 } }],
    },
    mechanism: {
      yaw: 30,
      pitch: 24,
      zoom: 1.1,
      exploded: true,
      keyPart: "battery",
      drift: 0.5,
      frameY: 0.5,
      beats: [
        // Wide, then close on the battery (amber). Zooms set by hand: the world's 30 mm lens
        // is wider than the automatic close-up maths assumes (docs/blender.md, track world).
        { cue: "battery", fallback: 0.08, do: "focus", part: "battery", shot: { yaw: 20, pitch: 30, zoom: 2.2 } },
        // "the same battery that drives the wheels": the dot runs to the drive unit.
        // From the rear three-quarter, where the drive unit shows behind the rear bench.
        { cue: "drives", fallback: 0.22, do: "flow", part: "battery", to: "motor", shot: { yaw: -50, pitch: 32, zoom: 2.6 } },
        // "On a freezing day, the heater...": the dot runs up the heat cable to the heater
        // (cued on "freezing": the line's first "heater" is its opening word). From the front
        // three-quarter, high, over the nose into the footwell.
        { cue: "freezing", fallback: 0.42, do: "flow", part: "battery", to: "heater", shot: { yaw: 70, pitch: 35, zoom: 2.6 } },
        // ..."a big part of the charge": the cable thickens (the sleeve scales in, amber).
        { cue: "big", fallback: 0.55, do: "appear", part: "heatsurge" },
        // Low and nearly head-on: the cable rises between the two front wheels, under the
        // heater (from the side the front wheel hides it, from above the heater does).
        { cue: "big", fallback: 0.55, do: "focus", part: "heatsurge", shot: { yaw: 86, pitch: 8, zoom: 6.5 } },
        // "a cold battery": back on the pack, from lower down, where its side shows.
        { cue: "cold", fallback: 0.78, do: "focus", part: "battery", shot: { yaw: 15, pitch: 14, zoom: 2.0 } },
        // "works worse too": frost forms on it and its glow dies.
        { cue: "worse", fallback: 0.88, do: "appear", part: "frost" },
        { cue: "too", fallback: 0.95, do: "stop" },
        { cue: "too", fallback: 0.95, do: "wide" },
      ],
    },
  },
  sfx: {
    custom: {
      // The cabin heater's blower spinning up.
      blower: { prompt: "car cabin heater fan blower spinning up, soft steady air whoosh, short, no engine", seconds: 1.4, volume: 0.12 },
      // Frost forming on the battery: a fine icy crackle.
      frost: { prompt: "fine ice crystals forming, delicate crisp crackle of frost, short, soft", seconds: 1.2, volume: 0.12 },
      // The charging cable plugged in.
      plug: { prompt: "electric car charging plug clicking into socket, single solid click, short", seconds: 0.6 },
    },
    cues: [
      { sound: "blower", section: "hook", cue: "heater" },
      { sound: "tick", section: "setup", cue: "motor" },
      { sound: "frost", section: "mechanism", cue: "worse" },
      { sound: "plug", section: "payoff", cue: "plugged" },
    ],
  },
  verify: [
    "'Warming the cabin is basically free' in a gas car: the engine's waste heat is used (fueleconomy.gov says gas engines lose 64-75% of energy as losses), but a gas car's range also drops in the cold. Fine as phrased; don't claim gas cars lose nothing",
    "The AAA study is from Feb 2019 (2017-18 cars). Newer EVs with heat pumps may lose less; say 'AAA tested' with the year in the source line",
  ],
  sections: [
    {
      id: "question",
      voiceover: "Do you know why electric cars lose 41% of their range in winter?",
      visual:
        "Question card over the Blender opener: a generic electric hatchback (procedural) in a snowy car park at night; on 'electric' the shell drops away (X-ray: wheels, steering wheel, battery, drive unit, heater) and the battery glows amber.",
    },
    {
      id: "hook",
      voiceover: "Nobody tells you the heater eats the range.",
      visual:
        "Blender hook: X-ray (shell, seats and dashboard gone); an amber dot runs from the battery up the heat cable to the heater, which turns amber on 'heater'.",
    },
    {
      id: "setup",
      voiceover: "An electric car has no free heat. A gas car warms you with heat from its engine. An electric motor makes very little heat.",
      visual:
        "2D: the electric car side on (traced from the 3D model) under a cabin temperature dial that reads low on 'no free heat'; on 'gas' the dial clears and a callout circle shows a gas engine with big heat waves; on 'motor' the callout swaps to the car's electric motor (amber, a leader line to it in the car) with one small faint wisp. Parallax + dust.",
    },
    {
      id: "mechanism",
      voiceover: "So the heater runs on the battery, the same one that drives the wheels. On a freezing day, the heater can use a big part of the charge. And a cold battery works worse too.",
      visual:
        "Blender cutaway: wide; close on the battery on 'battery' (amber); the amber dot to the drive unit on 'drives'; up the heat cable to the heater on 'freezing'; the heat cable thickens on 'big part'; back on the battery on 'cold', frost forms on 'worse' and its glow dies on 'too'; wide.",
    },
    {
      id: "payoff",
      voiceover: "AAA tested five electric cars at minus 7 Celsius, with the heater on. They lost 41% of their range. Tip: warm the car while it's still plugged in.",
      visual:
        "2D: a range bar (amber) with \"-7 °C (20 °F)\" over it on 'minus'; on 'lost' it shrinks to 59% and \"100 mi → 59 mi (161 → 95 km)\" appears; below, the same car on the ground; a charging post stands up beside it on 'Tip' and its cable runs to the car's charge flap on 'plugged' (plug amber, bar neutral).",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned why electric cars lose range in the cold.",
      visual:
        "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual:
        "Logo + tagline card.",
    },
  ],
};
